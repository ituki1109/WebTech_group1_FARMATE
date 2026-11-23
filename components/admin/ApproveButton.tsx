"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ApproveButton({
  endpoint,
  label,
}: {
  endpoint: string;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setBusy(true);
    setError(null);

    const response = await fetch(endpoint, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setError(body.error ?? "処理に失敗しました");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={approve}
        disabled={busy}
        className="h-11 rounded-md bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
      >
        {busy ? "処理中..." : label}
      </button>
      {error && (
        <p
          role="alert"
          className="mt-2 rounded-sm bg-danger-bg p-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
