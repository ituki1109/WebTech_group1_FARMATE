import Link from "next/link";

const links = [
  { href: "/farmer", label: "自分の求人" },
  { href: "/farmer/jobs/new", label: "求人登録" },
];

export default function FarmerNav() {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-bold text-farmer hover:bg-farmer-bg"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
