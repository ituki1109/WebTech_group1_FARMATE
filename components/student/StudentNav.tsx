import Link from "next/link";

const links = [
  { href: "/student", label: "求人一覧" },
  { href: "/student/applications", label: "応募状況" },
];

export default function StudentNav() {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-bold text-primary hover:bg-tint"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
