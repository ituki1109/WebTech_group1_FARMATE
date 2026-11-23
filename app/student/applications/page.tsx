import Link from "next/link";
import { redirect } from "next/navigation";

import StudentNav from "@/components/student/StudentNav";
import {
  applicationStatusClass,
  applicationStatusLabel,
  formatWorkDate,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: applications } = await supabase
    .from("applications")
    .select("id, job_id, status, message, created_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  const jobIds = [...new Set((applications ?? []).map((app) => app.job_id))];
  const { data: jobs } = jobIds.length
    ? await supabase
        .from("job_posts")
        .select("id, title, work_date, farm_id")
        .in("id", jobIds)
    : { data: [] };
  const jobMap = new Map((jobs ?? []).map((job) => [job.id, job]));

  const farmIds = [
    ...new Set((jobs ?? []).map((job) => job.farm_id).filter(Boolean)),
  ];
  const { data: farms } = farmIds.length
    ? await supabase
        .from("farm_profiles")
        .select("user_id, farm_name")
        .in("user_id", farmIds)
    : { data: [] };
  const farmMap = new Map((farms ?? []).map((farm) => [farm.user_id, farm]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <StudentNav />
      <h1 className="mt-6 font-heading text-2xl font-extrabold text-primary">
        応募状況
      </h1>

      {(applications ?? []).length === 0 ? (
        <p className="mt-6 rounded-md bg-surface p-6 text-sm text-text-muted shadow-card">
          まだ応募はありません。
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {(applications ?? []).map((application) => {
            const job = jobMap.get(application.job_id);
            const farm = job ? farmMap.get(job.farm_id) : undefined;

            return (
              <section
                key={application.id}
                className="rounded-md bg-surface p-5 shadow-card"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-pill px-3 py-1 text-sm font-bold ${
                      applicationStatusClass[application.status] ??
                      "bg-bg text-text-muted"
                    }`}
                  >
                    {applicationStatusLabel[application.status] ??
                      application.status}
                  </span>
                  {job && (
                    <Link
                      href={`/student/jobs/${job.id}`}
                      className="text-base font-bold text-text hover:text-primary hover:underline"
                    >
                      {job.title}
                    </Link>
                  )}
                </div>
                <p className="mt-2 text-sm text-text-muted">
                  {farm?.farm_name ?? "農園情報なし"}
                  {job ? ` ／ ${formatWorkDate(job.work_date)}` : ""}
                </p>
                {application.message && (
                  <p className="mt-3 rounded-sm bg-bg p-3 text-sm leading-6 text-text-muted">
                    {application.message}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
