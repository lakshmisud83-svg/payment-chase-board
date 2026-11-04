import { createClient } from "@supabase/supabase-js";

let browserClient = null;

export function getBrowserClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Missing " +
        [!url ? "NEXT_PUBLIC_SUPABASE_URL" : null, !key ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : null]
          .filter(Boolean)
          .join(" and ") +
        "."
    );
  }

  browserClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return browserClient;
}
