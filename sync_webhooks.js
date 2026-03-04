import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qdilrnnfmjkunxmukoek.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Bno4EVvqEe6Mt5Suix5Ulg_aGhlIyGK";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function run() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'herickmaia@gmail.com',
        password: 'maia1994'
    });

    if (error) {
        console.error("Login failed:", error);
        return;
    }

    const token = data.session.access_token;
    console.log("Logged in successfully. Triggering sync...");

    const res = await fetch(`${SUPABASE_URL}/functions/v1/evolution-sync-webhooks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
}

run();
