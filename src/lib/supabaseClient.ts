import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sicherheits-Check
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Supabase-Konfiguration fehlt! Bitte .env prüfen.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
