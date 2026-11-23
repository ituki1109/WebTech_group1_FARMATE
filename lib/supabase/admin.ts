import { createClient } from "@supabase/supabase-js";

// service role は RLS をバイパスする。サーバー側（Route Handler など）でのみ使い、
// 絶対にクライアントには渡さないこと。
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
