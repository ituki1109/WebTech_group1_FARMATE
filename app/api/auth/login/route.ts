import { NextResponse } from "next/server";

import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  ROLE_PATH,
  type DemoAccountKey,
} from "@/lib/demo-accounts";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let key: string | undefined;
  try {
    ({ key } = await request.json());
  } catch {
    return NextResponse.json({ error: "リクエストが不正です" }, { status: 400 });
  }

  // メールアドレスはクライアントから受け取らず、サーバー側の固定リストだけを使う。
  const email = DEMO_ACCOUNTS[key as DemoAccountKey];
  if (!email) {
    return NextResponse.json(
      { error: "不明なデモアカウントです" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: DEMO_PASSWORD,
  });
  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "ログインに失敗しました" },
      { status: 401 },
    );
  }

  // 権限は user_metadata ではなく profiles.role を見る（運営は seed で昇格している）。
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const redirectTo = profile?.role
    ? ROLE_PATH[profile.role] ?? "/login"
    : "/login";

  return NextResponse.json({ redirectTo });
}
