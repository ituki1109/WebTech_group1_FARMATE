"use client";

import { useState } from "react";

import type { DemoAccountKey } from "@/lib/demo-accounts";

const buttons: { key: DemoAccountKey; label: string; color: string }[] = [
  {
    key: "student",
    label: "学生として入る",
    color: "border-student bg-student-bg text-student",
  },
  {
    key: "farmer",
    label: "農家として入る",
    color: "border-farmer bg-farmer-bg text-farmer",
  },
  {
    key: "farmerPending",
    label: "農家（審査待ち）として入る",
    color: "border-farmer bg-farmer-bg text-farmer",
  },
  {
    key: "admin",
    label: "運営として入る",
    color: "border-primary bg-tint text-primary",
  },
];

export default function LoginButtons() {
  const [pending, setPending] = useState<DemoAccountKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(key: DemoAccountKey) {
    setPending(key);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "ログインに失敗しました");
      }
      window.location.assign(data.redirectTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ログインに失敗しました");
      setPending(null);
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-col gap-3">
        {buttons.map((button) => (
          <button
            key={button.key}
            type="button"
            onClick={() => signIn(button.key)}
            disabled={pending !== null}
            className={`flex h-12 items-center justify-center rounded-md border-2 px-4 text-sm font-bold transition hover:brightness-95 disabled:opacity-60 ${button.color}`}
          >
            {pending === button.key ? "サインイン中..." : button.label}
          </button>
        ))}
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-sm bg-danger-bg p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
    </>
  );
}
