import { createClient } from "@supabase/supabase-js";
function optionalClient() {
  const url = import.meta.env.VITE_SUPABASE_URL,
    key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  // A missing/mistyped optional integration must never break basic reading.
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}
export const cloud = optionalClient();
