import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 sm:px-6 sm:py-24">
      <section className="w-full max-w-xl rounded-md bg-surface p-8 text-center shadow-card">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
          FARMATE
        </h1>
        <p className="mt-4 text-sm leading-7 text-text-muted sm:text-base">
          農家と大学生をつなぐ短期バイトサービスです。
          <br />
          地域の農作業を、学びたい学生へ。マッチングを体験できるデモです。
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-bold text-on-primary transition-colors hover:bg-primary-hover"
        >
          ログインする
        </Link>
      </section>
    </div>
  );
}
