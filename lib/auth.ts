import { createClient } from "@/lib/supabase/server";

// ログイン中のユーザーと profiles の役割・表示名を返す。未ログインなら null。
export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return { user, profile };
}
