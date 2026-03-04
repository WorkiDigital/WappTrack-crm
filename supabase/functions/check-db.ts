
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

async function checkColumns() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.rpc('inspect_table_columns', { table_name_param: 'lead_messages' });

    // This section appears to be a task list that was mistakenly included in the code edit.
    // It is not valid JavaScript and will be ignored as per the instruction to make a syntactically correct file.
    // - [x] Refinar Sistema de Tags e Automação de Status
    //  - [x] Criar detecção robusta de palavras-chave (Regex)
    //  - [x] Implementar mudança automática para 'converted' e 'lost'
    // - [x] Realizar deploy e estabilizar Chat (Fallback Defensivo)
    //  - [x] Implementar lógica de fallback para salvar texto se colunas de mídia falharem
    //  - [x] Atualizar e fazer deploy das Edge Functions
    // - [ ] Verificar Mídias e Realtime
    //  - [ ] Confirmar execução correta do SQL no Supabase
    //  - [ ] Habilitar Realtime para a tabela `lead_messages`

    if (error) {
        // Fallback if RPC doesn't exist: try a simple select
        const { data: selectData, error: selectError } = await supabase
            .from('lead_messages')
            .select('media_url, media_type, mime_type, file_name')
            .limit(1);

        if (selectError) {
            console.error('❌ Columns MISSING or error:', selectError.message);
        } else {
            console.log('✅ Columns EXIST');
        }
    } else {
        console.log('Table definition:', data);
    }
}

checkColumns();
