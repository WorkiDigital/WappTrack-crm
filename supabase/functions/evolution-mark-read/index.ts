import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Authentication check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({ success: false, error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

        const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const token = authHeader.replace('Bearer ', '');
        const { data: userData, error: userError } = await authSupabase.auth.getUser(token);

        if (userError || !userData?.user) {
            return new Response(
                JSON.stringify({ success: false, error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = userData.user.id;
        const { instanceName, remoteJid } = await req.json();

        if (!instanceName || !remoteJid) {
            throw new Error('instanceName e remoteJid são obrigatórios');
        }

        // Buscar configurações da Evolution
        const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
        const evolutionBaseUrl = Deno.env.get('EVOLUTION_API_URL') || "https://evoapi.workidigital.tech";

        if (!evolutionApiKey) throw new Error('EVOLUTION_API_KEY não configurada');

        const url = `${evolutionBaseUrl.replace(/\/+$/, '')}/message/markRead/${instanceName}`;

        console.log(`👁️ Marcando como lido para ${remoteJid} na instância ${instanceName}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionApiKey,
            },
            body: JSON.stringify({
                remoteJid: remoteJid
            }),
        });

        const data = await response.json();
        console.log('✅ Resposta Evolution API (markRead):', data);

        return new Response(
            JSON.stringify({ success: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error('❌ Erro ao marcar como lido:', error);
        return new Response(
            JSON.stringify({ success: false, error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
