import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth";
import { ROLE_PATH } from "@/lib/demo-accounts";

const roleInfo = {
  student: { label: "学生", className: "bg-student-bg text-student" },
  farmer: { label: "農家", className: "bg-farmer-bg text-farmer" },
  admin: { label: "運営", className: "bg-tint text-primary" },
} as const;

type RoleTopProps = {
  role: keyof typeof roleInfo;
  title: string;
  description: string;
};

export default async function RoleTop({
  role,
  title,
  description,
}: RoleTopProps) {
  const current = await getCurrentProfile();
  if (!current) redirect("/login");

  // 別の役割のページを直接開いた場合は、その役割のトップへ戻す。
  if (current.profile.role !== role) {
    redirect(ROLE_PATH[current.profile.role] ?? "/login");
  }

  const info = roleInfo[role];

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 sm:px-6">
      <section className="w-full max-w-xl rounded-md bg-surface p-8 shadow-card">
        <span
          className={`inline-block rounded-pill px-3 py-1 text-sm font-bold ${info.className}`}
        >
          {info.label}
        </span>
        <h1 className="mt-4 font-heading text-2xl font-extrabold text-primary">
          {title}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {current.profile.display_name || current.user.email} さんでログイン中です。
        </p>
        <p className="mt-6 rounded-sm bg-bg p-4 text-sm leading-6 text-text-muted">
          {description}
        </p>
      </section>
    </div>
  );
}
