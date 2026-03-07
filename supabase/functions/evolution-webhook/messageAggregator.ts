// messageAggregator.ts - Message aggregation and processing lock utilities

export interface DeliverySettings {
  channel: string;
  feature_enabled: boolean;
  aggregation_window_ms: number;
  split_long_messages: boolean;
  max_chunk_size: number;
  typing_speed_cps: number;
  min_typing_delay_ms: number;
  max_typing_delay_ms: number;
  inter_chunk_pause_ms: number;
}

const DEFAULT_SETTINGS: DeliverySettings = {
  channel: 'whatsapp',
  feature_enabled: false,
  aggregation_window_ms: 4000,
  split_long_messages: false,
  max_chunk_size: 200,
  typing_speed_cps: 20,
  min_typing_delay_ms: 1500,
  max_typing_delay_ms: 8000,
  inter_chunk_pause_ms: 500,
};

export async function getDeliverySettings(supabase: any): Promise<DeliverySettings> {
  try {
    const { data, error } = await supabase
      .from('message_delivery_settings')
      .select('*')
      .eq('channel', 'whatsapp')
      .single();

    if (error || !data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...data };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function scheduleAggregation(supabase: any, leadId: string): Promise<void> {
  try {
    await supabase
      .from('ai_processing_queue')
      .upsert(
        { lead_id: leadId, scheduled_at: new Date().toISOString(), locked: false },
        { onConflict: 'lead_id', ignoreDuplicates: false }
      );
  } catch {
    // ignore - aggregation is best-effort
  }
}

export async function tryAcquireProcessingLock(supabase: any, leadId: string, windowMs: number): Promise<boolean> {
  try {
    // Atomic update: only lock if not already locked
    const { data, error } = await supabase
      .from('ai_processing_queue')
      .update({ locked: true, locked_at: new Date().toISOString() })
      .eq('lead_id', leadId)
      .eq('locked', false)
      .select('lead_id');

    if (error) return false;
    return data && data.length > 0;
  } catch {
    return false;
  }
}

export async function releaseProcessingLock(supabase: any, leadId: string): Promise<void> {
  try {
    await supabase
      .from('ai_processing_queue')
      .delete()
      .eq('lead_id', leadId);
  } catch {
    // ignore
  }
}

export async function getRecentMessages(supabase: any, leadId: string, windowMs: number): Promise<string | null> {
  try {
    const since = new Date(Date.now() - windowMs * 3).toISOString();

    const { data, error } = await supabase
      .from('lead_messages')
      .select('message_text, created_at')
      .eq('lead_id', leadId)
      .eq('is_from_me', false)
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return null;

    const messages = data
      .map((m: any) => m.message_text?.trim())
      .filter(Boolean)
      .join('\n');

    return messages || null;
  } catch {
    return null;
  }
}
