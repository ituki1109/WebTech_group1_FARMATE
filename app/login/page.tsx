import LoginButtons from "@/components/LoginButtons";

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 sm:px-6">
      <section className="w-full max-w-md rounded-md bg-surface p-8 shadow-card">
        <h1 className="font-heading text-2xl font-extrabold text-primary">
          ログイン
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          デモ用アカウントで入ります。パスワードは共通です。
        </p>
        <LoginButtons />
      </section>
    </div>
  );
}
