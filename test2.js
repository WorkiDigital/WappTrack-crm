import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = "https://ycwkhfbxuwsxafxdsvul.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljd2toZmJ4dXdzeGFmeGRzdnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDQyNTUsImV4cCI6MjA4Nzc4MDI1NX0.yS6Sofd7XgGTlsqYlClrlfIZW5L8pqflJTxrmam_--8";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function run() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'herickmaia@gmail.com',
        password: 'maia1994'
    });
    console.log("Error:", error?.message);
    if (data?.session) {
        console.log("Login OK!");
    }
}
run();
