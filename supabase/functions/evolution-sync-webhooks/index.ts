import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log('🔗 Iniciando sincronização de webhooks...');

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ success: false, error: 'Authorization header missing' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
        const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
        const evolutionBaseUrl = Deno.env.get('EVOLUTION_API_URL') || "https://evoapi.workidigital.tech";

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase environment variables (URL/ANON) missing');
        }

        if (!evolutionApiKey) {
            throw new Error('EVOLUTION_API_KEY secret missing in Supabase');
        }

        // Client with user token for RLS
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error('❌ Erro de autenticação:', authError);
            return new Response(JSON.stringify({ success: false, error: 'Sessão inválida ou expirada' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`👤 Usuário autenticado: ${user.id}`);

        // Buscar instâncias do usuário
        const { data: instances, error: instError } = await supabase
            .from('whatsapp_instances')
            .select('*')
            .eq('user_id', user.id);

        if (instError) {
            throw new Error(`Erro ao buscar instâncias: ${instError.message}`);
        }

        if (!instances || instances.length === 0) {
            return new Response(JSON.stringify({ success: true, message: 'Nenhuma instância encontrada', results: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const webhookUrl = `https://kdnmzyaozdssdwegdwlb.supabase.co/functions/v1/evolution-webhook`;
        const results = [];

        for (const inst of instances) {
            const instanceName = inst.instance_name;
            console.log(`🔄 Sincronizando: ${instanceName}`);

            const url = `${evolutionBaseUrl.replace(/\/+$/, '')}/webhook/instance/${instanceName}`;

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': evolutionApiKey,
                    },
                    body: JSON.stringify({
                        url: webhookUrl,
                        enabled: true,
                        webhook_by_events: false,
                        webhook_base64: false,
                        events: [
                            "QRCODE_UPDATED",
                            "MESSAGES_UPSERT",
                            "MESSAGES_UPDATE",
                            "SEND_MESSAGE",
                            "CONNECTION_UPDATE"
                        ]
                    }),
                });

                const text = await response.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch {
                    data = { raw: text };
                }

                results.push({
                    instance: instanceName,
                    success: response.ok,
                    status: response.status,
                    data
                });

                console.log(`✅ Resultado para ${instanceName}: ${response.status}`);
            } catch (err) {
                console.error(`❌ Erro de fetch para ${instanceName}:`, err);
                results.push({
                    instance: instanceName,
                    success: false,
                    error: (err as Error).message
                });
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('💥 Erro fatal sync-webhooks:', error);
        return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
