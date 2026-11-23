import Link from "next/link";
import { notFound } from "next/navigation";

import ApplyButton from "@/components/student/ApplyButton";
import FarmPrivateInfo from "@/components/student/FarmPrivateInfo";
import StudentNav from "@/components/student/StudentNav";
import {
  applicationStatusClass,
  applicationStatusLabel,
  formatTime,
  formatWorkDate,
  formatYen,
  hasPickup,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type JobDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: JobDetailProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("job_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!job) notFound();

  const { data: farm } = await supabase
    .from("farm_profiles")
    .select("farm_name, prefecture, city")
    .eq("user_id", job.farm_id)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: application } = user
    ? await supabase
        .from("applications")
        .select("id, status")
        .eq("job_id", id)
        .eq("student_id", user.id)
        .maybeSingle()
    : { data: null };

  // この農家とのマッチ有無（RLS で自分のマッチしか見えない）
  const { data: match } = user
    ? await supabase
        .from("matches")
        .select("id")
        .eq("student_id", user.id)
        .eq("farm_id", job.farm_id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <StudentNav />

      <section className="mt-6 rounded-md bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap gap-2">
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

        <h1 className="mt-4 font-heading text-2xl font-extrabold text-primary">
          {job.title}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {farm?.farm_name ?? "農園情報なし"} ／{" "}
          {[farm?.prefecture, farm?.city].filter(Boolean).join("")}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 rounded-md bg-bg p-4 text-sm sm:grid-cols-4">
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

        <div className="mt-6 space-y-5 text-sm">
          <section>
            <h2 className="font-bold text-text">内容</h2>
            <p className="mt-1 leading-7 text-text-muted">
              {job.description ?? "記載はありません。"}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-text">持ち物</h2>
            <p className="mt-1 leading-7 text-text-muted">
              持ち物の指定は登録されていません。動きやすい服装でお越しください。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-text">送迎</h2>
            <p className="mt-1 leading-7 text-text-muted">
              {job.transport_note ?? "送迎の記載はありません。"}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-text">食事・宿泊</h2>
            <p className="mt-1 leading-7 text-text-muted">
              食事: {job.meal_provided ? "あり" : "なし"} ／ 宿泊:{" "}
              {job.lodging_note ?? "記載はありません。"}
            </p>
          </section>

          {job.has_hazard && (
            <section className="rounded-sm bg-farmer-bg p-4">
              <h2 className="font-bold text-farmer">危険作業あり</h2>
              <p className="mt-1 leading-7 text-text">
                {job.hazard_note ?? "注意事項の記載はありません。"}
              </p>
            </section>
          )}

          <FarmPrivateInfo farmId={job.farm_id} hasMatch={!!match} />
        </div>
      </section>

      <div className="mt-6">
        {application ? (
          <div className="rounded-md bg-surface p-5 shadow-card">
            <p className="text-sm text-text">この求人には応募済みです。</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-pill px-3 py-1 text-sm font-bold ${
                  applicationStatusClass[application.status] ?? "bg-bg text-text-muted"
                }`}
              >
                {applicationStatusLabel[application.status] ?? application.status}
              </span>
              <Link
                href="/student/applications"
                className="text-sm font-bold text-primary hover:underline"
              >
                応募状況を見る
              </Link>
            </div>
          </div>
        ) : job.status === "open" && user ? (
          <ApplyButton jobId={job.id} studentId={user.id} />
        ) : (
          <p className="rounded-md bg-surface p-5 text-sm text-text-muted shadow-card">
            この求人は現在応募できません。
          </p>
        )}
      </div>
    </div>
  );
}
