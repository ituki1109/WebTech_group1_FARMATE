import Image from "next/image";
import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth";
import { ROLE_PATH } from "@/lib/demo-accounts";

const roleInfo = {
  student: { label: "学生", className: "bg-student-bg text-student" },
  farmer: { label: "農家", className: "bg-farmer-bg text-farmer" },
  admin: { label: "運営", className: "bg-tint text-primary" },
} as const;

export default async function Header() {
  const current = await getCurrentProfile();
  const role = current?.profile.role as keyof typeof roleInfo | undefined;
  const badge = role ? roleInfo[role] : undefined;
  const home = role ? ROLE_PATH[role] ?? "/login" : "/login";

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-3 sm:px-6">
        <Link href={home} className="shrink-0">
          <Image
            src="/brand/farmate-logo.png"
            alt="FARMATE"
            width={378}
            height={91}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <div className="flex min-w-0 items-center gap-2">
          {current ? (
            <>
              <Link
                href={home}
                className="min-w-0 truncate text-sm font-bold text-text hover:underline"
              >
                {current.profile.display_name || current.user.email}
              </Link>
              <span
                className={`shrink-0 rounded-pill px-3 py-1 text-sm font-bold ${
                  badge?.className ?? "bg-tint text-text-muted"
                }`}
              >
                {badge?.label ?? "未ログイン"}
              </span>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="h-11 shrink-0 rounded-md border border-border bg-surface px-3 text-sm font-bold text-primary hover:bg-tint"
                >
                  切り替え
                </button>
              </form>
            </>
          ) : (
            <>
              <span className="truncate text-sm text-text-muted">ゲスト</span>
              <span className="shrink-0 rounded-pill bg-tint px-3 py-1 text-sm font-bold text-text-muted">
                未ログイン
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
