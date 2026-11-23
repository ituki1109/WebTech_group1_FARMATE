"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ApplyButtonProps = {
  jobId: string;
  studentId: string;
};

export default function ApplyButton({ jobId, studentId }: ApplyButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function apply() {
    setBusy(true);
    setError(null);

    // ブラウザの Supabase クライアントで insert し、権限チェックは RLS に任せる。
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { error: insertError } = await supabase.from("applications").insert({
      job_id: jobId,
      student_id: studentId,
      status: "applied",
      message: message || null,
    });

    if (insertError) {
      setError(insertError.message);
      setBusy(false);
      return;
    }

    setDone(true);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-md bg-surface p-5 shadow-card">
      <label
        htmlFor="apply-message"
        className="block text-sm font-bold text-text"
      >
        応募メッセージ（任意）
      </label>
      <textarea
        id="apply-message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={3}
        className="mt-2 w-full rounded-sm border border-border bg-bg p-3 text-sm text-text"
        placeholder="志望動機などを入力してください"
      />
      <button
        type="button"
        onClick={apply}
        disabled={busy || done}
        className="mt-4 h-11 w-full rounded-md bg-primary text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
      >
        {done ? "応募しました" : busy ? "応募中..." : "この求人に応募する"}
      </button>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-sm bg-danger-bg p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
