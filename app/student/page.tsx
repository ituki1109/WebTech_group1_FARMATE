import Link from "next/link";

import StudentNav from "@/components/student/StudentNav";
import {
  formatTime,
  formatWorkDate,
  formatYen,
  hasPickup,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function StudentHome() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("job_posts")
    .select(
      "id, title, work_date, start_time, end_time, hourly_wage_yen, capacity, transport_note, meal_provided, has_hazard, status, farm_id",
    )
    .in("status", ["open", "filled"])
    .order("work_date", { ascending: true });

  const farmIds = [...new Set((jobs ?? []).map((job) => job.farm_id))];
  const { data: farms } = farmIds.length
    ? await supabase
        .from("farm_profiles")
        .select("user_id, farm_name, prefecture, city")
        .in("user_id", farmIds)
    : { data: [] };
  const farmMap = new Map((farms ?? []).map((farm) => [farm.user_id, farm]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <StudentNav />
      <h1 className="mt-6 font-heading text-2xl font-extrabold text-primary">
        求人一覧
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        登録されている農作業の求人です。
      </p>

      {(jobs ?? []).length === 0 ? (
        <p className="mt-6 rounded-md bg-surface p-6 text-sm text-text-muted shadow-card">
          現在公開中の求人はありません。
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {(jobs ?? []).map((job) => {
            const farm = farmMap.get(job.farm_id);
            const area = [farm?.prefecture, farm?.city]
              .filter(Boolean)
              .join("");

            return (
              <Link
                key={job.id}
                href={`/student/jobs/${job.id}`}
                className="block rounded-md bg-surface p-5 shadow-card transition hover:brightness-95"
              >
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-pill px-3 py-1 text-sm font-bold ${
                      job.status === "open"
                        ? "bg-tint text-primary"
                        : "bg-bg text-text-muted"
                    }`}
                  >
                    {job.status === "open" ? "募集中" : "募集終了"}
                  </span>
                  {hasPickup(job.transport_note) && (
                    <span className="rounded-pill bg-student-bg px-3 py-1 text-sm font-bold text-student">
                      送迎あり
                    </span>
                  )}
                  {job.meal_provided && (
                    <span className="rounded-pill bg-tint px-3 py-1 text-sm font-bold text-primary">
                      食事あり
                    </span>
                  )}
                  {job.has_hazard && (
                    <span className="rounded-pill bg-farmer-bg px-3 py-1 text-sm font-bold text-farmer">
                      危険作業
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-base font-bold text-text">
                  {job.title}
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  {farm?.farm_name ?? "農園情報なし"} ／ {area || "エリア未設定"}
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-text-muted">日付</dt>
                    <dd className="font-bold text-text">
                      {formatWorkDate(job.work_date)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">時間</dt>
                    <dd className="font-bold text-text">
                      {formatTime(job.start_time)}〜{formatTime(job.end_time)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">時給</dt>
                    <dd className="font-bold text-text">
                      {formatYen(job.hourly_wage_yen)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">募集人数</dt>
                    <dd className="font-bold text-text">{job.capacity}名</dd>
                  </div>
                </dl>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
