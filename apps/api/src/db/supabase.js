import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

if (!config.supabaseUrl || !config.supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_KEY must be defined in the environment.");
}

export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: { persistSession: false },
});
