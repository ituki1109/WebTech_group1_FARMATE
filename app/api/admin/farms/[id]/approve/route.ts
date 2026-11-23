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

  const { data: farm } = await supabase
    .from("farm_profiles")
    .select("user_id, verify_status")
    .eq("user_id", id)
    .maybeSingle();
  if (!farm) {
    return NextResponse.json({ error: "農家が見つかりません" }, { status: 404 });
  }
  if (farm.verify_status !== "pending") {
    return NextResponse.json(
      { error: "この農家は既に審査済みです" },
      { status: 409 },
    );
  }

  // ここから service role（RLS をバイパス）。ブラウザにはキーを渡さない。
  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("farm_profiles")
    .update({
      verify_status: "verified",
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq("user_id", id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: logError } = await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "farm_verified",
    table_name: "farm_profiles",
    record_id: id,
    detail: { from: "pending", to: "verified" },
  });
  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
