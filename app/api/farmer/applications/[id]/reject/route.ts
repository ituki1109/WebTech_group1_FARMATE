import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteProps) {
  const { id } = await params;

  // 不承認はユーザーセッションの RLS に任せる（service role は使わない）。
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { data: application } = await supabase
    .from("applications")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (!application) {
    return NextResponse.json({ error: "応募が見つかりません" }, { status: 404 });
  }
  if (application.status !== "applied") {
    return NextResponse.json(
      { error: "この応募は既に処理されています" },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: "rejected" })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
