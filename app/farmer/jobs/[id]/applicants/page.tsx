import { notFound, redirect } from "next/navigation";

import ApplicantList, {
  type Applicant,
} from "@/components/farmer/ApplicantList";
import FarmerNav from "@/components/farmer/FarmerNav";
import { createClient } from "@/lib/supabase/server";

type ApplicantsProps = {
  params: Promise<{ id: string }>;
};

export default async function ApplicantsPage({ params }: ApplicantsProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: job } = await supabase
    .from("job_posts")
    .select("id, title")
    .eq("id", id)
    .eq("farm_id", user.id)
    .maybeSingle();
  if (!job) notFound();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, student_id, status, message")
    .eq("job_id", id)
    .order("created_at", { ascending: true });

  const studentIds = [
    ...new Set((applications ?? []).map((app) => app.student_id)),
  ];
  const { data: students } = studentIds.length
    ? await supabase
        .from("student_profiles")
        .select("user_id, university, faculty, stamina_level")
        .in("user_id", studentIds)
    : { data: [] };
  const { data: profiles } = studentIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", studentIds)
    : { data: [] };

  const studentMap = new Map((students ?? []).map((s) => [s.user_id, s]));
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const applicants: Applicant[] = (applications ?? []).map((app) => {
    const student = studentMap.get(app.student_id);
    return {
      id: app.id,
      name: profileMap.get(app.student_id)?.display_name || "名前未設定",
      university: student?.university ?? null,
      faculty: student?.faculty ?? null,
      staminaLevel: student?.stamina_level ?? null,
      message: app.message ?? null,
      status: app.status,
    };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <FarmerNav />
      <h1 className="mt-6 font-heading text-2xl font-extrabold text-primary">
        応募者一覧
      </h1>
      <p className="mt-1 text-sm text-text-muted">{job.title}</p>
      <ApplicantList applicants={applicants} />
    </div>
  );
}
