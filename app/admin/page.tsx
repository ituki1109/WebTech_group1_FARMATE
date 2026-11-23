import { redirect } from "next/navigation";

import ApproveButton from "@/components/admin/ApproveButton";
import { formatWorkDate, reportStatusLabel } from "@/lib/format";
import { ROLE_PATH } from "@/lib/demo-accounts";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (adminProfile?.role !== "admin") {
    redirect(ROLE_PATH[adminProfile?.role ?? ""] ?? "/");
  }

  // 農家の審査（pending）
  const { data: pendingFarms } = await supabase
    .from("farm_profiles")
    .select("user_id, farm_name, prefecture, city")
    .eq("verify_status", "pending");
  const { data: farmOwners } = pendingFarms?.length
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in(
          "id",
          pendingFarms.map((farm) => farm.user_id),
        )
    : { data: [] };
  const ownerMap = new Map((farmOwners ?? []).map((p) => [p.id, p]));

  // 危険作業の承認待ち（has_hazard かつ hazard_approved_at が NULL）
  const { data: hazardJobs } = await supabase
    .from("job_posts")
    .select("id, title, hazard_note, work_date, status, farm_id")
    .eq("has_hazard", true)
    .is("hazard_approved_at", null);
  const hazardFarmIds = [
    ...new Set((hazardJobs ?? []).map((job) => job.farm_id)),
  ];
  const { data: hazardFarms } = hazardFarmIds.length
    ? await supabase
        .from("farm_profiles")
        .select("user_id, farm_name")
        .in("user_id", hazardFarmIds)
    : { data: [] };
  const hazardFarmMap = new Map(
    (hazardFarms ?? []).map((farm) => [farm.user_id, farm]),
  );

  // 通報一覧（読み取りのみ）
  const { data: reports } = await supabase
    .from("reports")
    .select("id, category, detail, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6">
      <h1 className="font-heading text-2xl font-extrabold text-primary">
        運営トップ
      </h1>

      <section>
        <h2 className="text-lg font-bold text-text">農家の審査</h2>
        <p className="mt-1 text-sm text-text-muted">
          審査中の農家を承認すると、求人登録ができるようになります。
        </p>
        <div className="mt-4 space-y-3">
          {(pendingFarms ?? []).length === 0 ? (
            <p className="rounded-md bg-surface p-5 text-sm text-text-muted shadow-card">
              審査中の農家はいません。
            </p>
          ) : (
            (pendingFarms ?? []).map((farm) => (
              <div
                key={farm.user_id}
                className="rounded-md bg-surface p-5 shadow-card"
              >
                <h3 className="text-base font-bold text-text">
                  {farm.farm_name}
                </h3>
                <p className="mt-1 text-sm text-text-muted">
                  {ownerMap.get(farm.user_id)?.display_name ?? "名前未設定"} ／{" "}
                  {farm.prefecture}
                  {farm.city}
                </p>
                <div className="mt-4">
                  <ApproveButton
                    endpoint={`/api/admin/farms/${farm.user_id}/approve`}
                    label="承認"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text">危険作業の承認</h2>
        <p className="mt-1 text-sm text-text-muted">
          承認すると求人が公開されます。
        </p>
        <div className="mt-4 space-y-3">
          {(hazardJobs ?? []).length === 0 ? (
            <p className="rounded-md bg-surface p-5 text-sm text-text-muted shadow-card">
              承認待ちの危険作業求人はいません。
            </p>
          ) : (
            (hazardJobs ?? []).map((job) => (
              <div
                key={job.id}
                className="rounded-md bg-surface p-5 shadow-card"
              >
                <h3 className="text-base font-bold text-text">{job.title}</h3>
                <p className="mt-1 text-sm text-text-muted">
                  {hazardFarmMap.get(job.farm_id)?.farm_name ?? "農園情報なし"}{" "}
                  ／ {formatWorkDate(job.work_date)}
                </p>
                <p className="mt-3 rounded-sm bg-farmer-bg p-3 text-sm leading-6 text-text">
                  {job.hazard_note ?? "危険作業の説明はありません。"}
                </p>
                <div className="mt-4">
                  <ApproveButton
                    endpoint={`/api/admin/jobs/${job.id}/approve`}
                    label="承認して公開"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-text">通報一覧（読み取りのみ）</h2>
        <div className="mt-4 space-y-3">
          {(reports ?? []).length === 0 ? (
            <p className="rounded-md bg-surface p-5 text-sm text-text-muted shadow-card">
              通報はありません。
            </p>
          ) : (
            (reports ?? []).map((report) => (
              <div
                key={report.id}
                className="rounded-md bg-surface p-5 shadow-card"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-pill bg-tint px-3 py-1 text-sm font-bold text-primary">
                    {reportStatusLabel[report.status] ?? report.status}
                  </span>
                  <h3 className="text-base font-bold text-text">
                    {report.category}
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  {typeof report.detail === "string"
                    ? report.detail
                    : JSON.stringify(report.detail)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
