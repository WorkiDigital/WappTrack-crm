
// Message Aggregator — controle de janela de agregação e lock por conversa
// Garante que múltiplas mensagens rápidas do mesmo lead resultem em 1 única chamada à IA

export interface DeliverySettings {
  feature_enabled: boolean;
  split_long_messages: boolean;
  max_chars_per_chunk: number;
  simulate_typing: boolean;
  presence_type: string;
  short_delay_ms: number;
  medium_delay_ms: number;
  long_delay_ms: number;
  pause_between_chunks_min_ms: number;
  pause_between_chunks_max_ms: number;
  aggregation_window_ms: number;
  separate_cta_message: boolean;
}

const DEFAULT_SETTINGS: DeliverySettings = {
  feature_enabled: false, // desativado por padrão até tabelas serem criadas
  split_long_messages: true,
  max_chars_per_chunk: 200,
  simulate_typing: true,
  presence_type: 'composing',
  short_delay_ms: 2000,
  medium_delay_ms: 3000,
  long_delay_ms: 4500,
  pause_between_chunks_min_ms: 1000,
  pause_between_chunks_max_ms: 3000,
  aggregation_window_ms: 4000,
  separate_cta_message: true,
};

/**
 * Busca configurações de entrega do banco.
 * Retorna defaults se tabela não existir (fallback seguro).
 */
export async function getDeliverySettings(supabase: any): Promise<DeliverySettings> {
  try {
    const { data, error } = await supabase
      .from('message_delivery_settings')
      .select('*')
      .eq('channel', 'whatsapp')
      .single();

    if (error || !data) {
      console.log('⚙️ [AGGREGATOR] message_delivery_settings não encontrada — usando defaults (feature_enabled=false)');
      return DEFAULT_SETTINGS;
    }

    return data as DeliverySettings;
  } catch (err) {
    console.log('⚙️ [AGGREGATOR] Erro ao buscar settings — usando defaults:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Registra/atualiza o lead na fila de processamento.
 * Atualiza last_message_at para agora, estendendo a janela de agregação.
 */
export async function scheduleAggregation(supabase: any, leadId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_processing_queue')
      .upsert({
        lead_id: leadId,
        status: 'pending',
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'lead_id' });

    if (error) {
      console.error(`⏳ [AGGREGATOR] Erro ao registrar lead ${leadId} na fila:`, error);
    } else {
      console.log(`⏳ [AGGREGATOR] Lead ${leadId} registrado na fila de agregação`);
    }
  } catch (err) {
    console.error(`⏳ [AGGREGATOR] Exceção ao registrar lead ${leadId}:`, err);
  }
}

/**
 * Tenta adquirir o lock de processamento de forma atômica.
 * Apenas 1 invocação vence por lead_id.
 * Uma invocação perde se: outra já ganhou (status=processing) OU nova mensagem chegou (last_message_at > now()-window).
 */
export async function tryAcquireProcessingLock(
  supabase: any,
  leadId: string,
  windowMs: number
): Promise<boolean> {
  try {
    const windowSecs = windowMs / 1000;

    // UPDATE atômico: só atualiza se status=pending E last_message_at está dentro da janela passada
    const { data, error } = await supabase.rpc('acquire_ai_processing_lock', {
      p_lead_id: leadId,
      p_window_secs: windowSecs,
    });

    if (error) {
      // RPC não existe ainda — tenta fallback via update direto
      console.warn(`⏳ [AGGREGATOR] RPC não disponível, tentando fallback:`, error.message);
      return await tryAcquireProcessingLockFallback(supabase, leadId, windowMs);
    }

    const acquired = data === true;
    console.log(`⏳ [AGGREGATOR] Lead ${leadId}: lock ${acquired ? '✅ adquirido' : '❌ não adquirido'}`);
    return acquired;
  } catch (err) {
    console.error(`⏳ [AGGREGATOR] Exceção ao adquirir lock para ${leadId}:`, err);
    return false;
  }
}

/**
 * Fallback sem RPC: usa lógica client-side (menos atômico mas funcional para baixo volume).
 */
async function tryAcquireProcessingLockFallback(
  supabase: any,
  leadId: string,
  windowMs: number
): Promise<boolean> {
  try {
    const cutoff = new Date(Date.now() - windowMs).toISOString();

    // Verifica se pode processar
    const { data: current } = await supabase
      .from('ai_processing_queue')
      .select('status, last_message_at')
      .eq('lead_id', leadId)
      .single();

    if (!current) return false;
    if (current.status === 'processing') {
      console.log(`⏳ [AGGREGATOR] Lead ${leadId}: já em processamento`);
      return false;
    }
    if (current.last_message_at > cutoff) {
      console.log(`⏳ [AGGREGATOR] Lead ${leadId}: nova mensagem chegou, janela reiniciada`);
      return false;
    }

    // Tenta adquirir
    const { error } = await supabase
      .from('ai_processing_queue')
      .update({ status: 'processing', locked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('lead_id', leadId)
      .eq('status', 'pending');

    return !error;
  } catch (err) {
    console.error(`⏳ [AGGREGATOR] Erro no fallback lock:`, err);
    return false;
  }
}

/**
 * Libera o lock após processamento concluído.
 */
export async function releaseProcessingLock(supabase: any, leadId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_processing_queue')
      .delete()
      .eq('lead_id', leadId);

    if (error) {
      console.error(`⏳ [AGGREGATOR] Erro ao liberar lock para ${leadId}:`, error);
    } else {
      console.log(`⏳ [AGGREGATOR] Lock liberado para lead ${leadId}`);
    }
  } catch (err) {
    console.error(`⏳ [AGGREGATOR] Exceção ao liberar lock:`, err);
  }
}

/**
 * Busca todas as mensagens recebidas do lead dentro da janela de tempo
 * e retorna como texto consolidado para passar à IA.
 */
export async function getRecentMessages(
  supabase: any,
  leadId: string,
  windowMs: number
): Promise<string> {
  try {
    // Janela generosa: 2x o window para pegar todas as msgs do ciclo
    const cutoff = new Date(Date.now() - windowMs * 2).toISOString();

    const { data, error } = await supabase
      .from('lead_messages')
      .select('message_text, created_at')
      .eq('lead_id', leadId)
      .eq('is_from_me', false)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return '';
    }

    const consolidated = data
      .map((m: any) => m.message_text)
      .filter(Boolean)
      .join('\n');

    if (data.length > 1) {
      console.log(`⏳ [AGGREGATOR] Consolidadas ${data.length} mensagens para lead ${leadId}: "${consolidated.substring(0, 100)}..."`);
    }

    return consolidated;
  } catch (err) {
    console.error(`⏳ [AGGREGATOR] Erro ao buscar mensagens recentes:`, err);
    return '';
  }
}
