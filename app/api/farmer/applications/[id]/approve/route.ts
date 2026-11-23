import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteProps) {
  const { id } = await params;

  // まずはユーザーセッション（RLS 適用）で、自分の求人への応募かどうかを確認する。
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { data: application } = await supabase
    .from("applications")
    .select("id, job_id, student_id, status")
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

  // ここから先だけ service role。ブラウザにはキーを渡さない。
  const admin = createAdminClient();
  const { data: existingMatch } = await admin
    .from("matches")
    .select("id")
    .eq("application_id", id)
    .maybeSingle();

  if (!existingMatch) {
    const { error: matchError } = await admin.from("matches").insert({
      application_id: id,
      job_id: application.job_id,
      student_id: application.student_id,
      farm_id: user.id,
    });
    if (matchError) {
      return NextResponse.json({ error: matchError.message }, { status: 500 });
    }
  }

  const { error: updateError } = await admin
    .from("applications")
    .update({ status: "accepted" })
    .eq("id", id);
  if (updateError) {
    // 更新に失敗したら作成したマッチを取り消す（不整合を残さない）
    if (!existingMatch) {
      await admin.from("matches").delete().eq("application_id", id);
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
