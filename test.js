import { createClient } from '@supabase/supabase-js';
const supabaseUrl = "https://ycwkhfbxuwsxafxdsvul.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljd2toZmJ4dXdzeGFmeGRzdnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDQyNTUsImV4cCI6MjA4Nzc4MDI1NX0.yS6Sofd7XgGTlsqYlClrlfIZW5L8pqflJTxrmam_--8";
const supabase = createClient(supabaseUrl, SUPABASE_PUBLISHABLE_KEY);

async function run() {
    const { data, error } = await supabase.from('leads').select('*').order('updated_at', { ascending: false }).range(0, 19);
    console.log("Error loading leads:", JSON.stringify(error, null, 2));
    console.log("Data length:", data?.length);

    const { data: d2, error: e2 } = await supabase.from('lead_messages').select('*').limit(1);
    console.log("Error loading messages:", JSON.stringify(e2, null, 2));
}
run();
