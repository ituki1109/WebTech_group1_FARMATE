import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { data: job } = await supabase
    .from("job_posts")
    .select("id, has_hazard, hazard_approved_at, status")
    .eq("id", id)
    .maybeSingle();
  if (!job) {
    return NextResponse.json({ error: "求人が見つかりません" }, { status: 404 });
  }
  if (!job.has_hazard || job.hazard_approved_at) {
    return NextResponse.json(
      { error: "この求人は承認対象ではありません" },
      { status: 409 },
    );
  }

  // ここから service role（RLS をバイパス）。ブラウザにはキーを渡さない。
  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("job_posts")
    .update({
      hazard_approved_at: new Date().toISOString(),
      hazard_approved_by: user.id,
      status: "open",
    })
    .eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: logError } = await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "hazard_job_approved",
    table_name: "job_posts",
    record_id: id,
    detail: { from: "draft", to: "open" },
  });
  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
