import Link from "next/link";
import { redirect } from "next/navigation";

import FarmerNav from "@/components/farmer/FarmerNav";
import { formatWorkDate, formatYen } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function FarmerHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: farm } = await supabase
    .from("farm_profiles")
    .select("farm_name, verify_status")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: jobs } = await supabase
    .from("job_posts")
    .select("id, title, work_date, hourly_wage_yen, capacity, status, has_hazard")
    .eq("farm_id", user.id)
    .order("work_date", { ascending: true });

  const verifyStatus = farm?.verify_status;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <FarmerNav />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-extrabold text-primary">
          自分の求人
        </h1>
        <span
          className={`rounded-pill px-3 py-1 text-sm font-bold ${
            verifyStatus === "verified"
              ? "bg-tint text-primary"
              : "bg-farmer-bg text-farmer"
          }`}
        >
          {farm?.farm_name ?? "農園情報なし"} ／{" "}
          {verifyStatus === "verified" ? "承認済み" : "審査中"}
        </span>
      </div>

      {verifyStatus !== "verified" && (
        <p className="mt-4 rounded-sm bg-farmer-bg p-4 text-sm text-farmer">
          審査中のため登録できません
        </p>
      )}

      {(jobs ?? []).length === 0 ? (
        <p className="mt-6 rounded-md bg-surface p-6 text-sm text-text-muted shadow-card">
          まだ求人はありません。「求人登録」から作成してください。
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {(jobs ?? []).map((job) => (
            <section
              key={job.id}
              className="rounded-md bg-surface p-5 shadow-card"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-pill px-3 py-1 text-sm font-bold ${
                    job.status === "open"
                      ? "bg-tint text-primary"
                      : "bg-bg text-text-muted"
                  }`}
                >
                  {job.status === "open" ? "公開中" : "下書き"}
                </span>
                {job.has_hazard && (
                  <span className="rounded-pill bg-farmer-bg px-3 py-1 text-sm font-bold text-farmer">
                    危険作業
                  </span>
                )}
              </div>
              <h2 className="mt-3 text-base font-bold text-text">{job.title}</h2>
              <p className="mt-1 text-sm text-text-muted">
                {formatWorkDate(job.work_date)} ／ {formatYen(job.hourly_wage_yen)}
                ／ {job.capacity}名
              </p>
              <Link
                href={`/farmer/jobs/${job.id}/applicants`}
                className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-bold text-on-primary hover:bg-primary-hover"
              >
                応募者一覧を見る
              </Link>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
