"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  applicationStatusClass,
  applicationStatusLabel,
} from "@/lib/format";

export type Applicant = {
  id: string;
  name: string;
  university: string | null;
  faculty: string | null;
  staminaLevel: number | null;
  message: string | null;
  status: string;
};

export default function ApplicantList({
  applicants,
}: {
  applicants: Applicant[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError(null);

    const response = await fetch(`/api/farmer/applications/${id}/${action}`, {
      method: "POST",
    });
    const body = await response.json().catch(() => ({}));
    setBusyId(null);

    if (!response.ok) {
      setError(body.error ?? "処理に失敗しました");
      return;
    }

    if (action === "approve") setToast(true);
    router.refresh();
  }

  return (
    <>
      <div className="mt-6 space-y-4">
        {applicants.length === 0 ? (
          <p className="rounded-md bg-surface p-6 text-sm text-text-muted shadow-card">
            まだ応募はありません。
          </p>
        ) : (
          applicants.map((applicant) => (
            <section
              key={applicant.id}
              className="rounded-md bg-surface p-5 shadow-card"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-base font-bold text-text">
                  {applicant.name}
                </h2>
                <span
                  className={`rounded-pill px-3 py-1 text-sm font-bold ${
                    applicationStatusClass[applicant.status] ??
                    "bg-bg text-text-muted"
                  }`}
                >
                  {applicationStatusLabel[applicant.status] ?? applicant.status}
                </span>
              </div>

              <dl className="mt-3 grid gap-2 text-sm text-text-muted sm:grid-cols-3">
                <div>
                  <dt>大学</dt>
                  <dd className="font-bold text-text">
                    {applicant.university ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt>学部</dt>
                  <dd className="font-bold text-text">
                    {applicant.faculty ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt>体力レベル</dt>
                  <dd className="font-bold text-text">
                    {applicant.staminaLevel === null
                      ? "—"
                      : `${applicant.staminaLevel} / 5`}
                  </dd>
                </div>
              </dl>

              {applicant.message && (
                <p className="mt-3 rounded-sm bg-bg p-3 text-sm leading-6 text-text-muted">
                  {applicant.message}
                </p>
              )}

              {applicant.status === "applied" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => act(applicant.id, "approve")}
                    disabled={busyId === applicant.id}
                    className="h-11 rounded-md bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
                  >
                    承認
                  </button>
                  <button
                    type="button"
                    onClick={() => act(applicant.id, "reject")}
                    disabled={busyId === applicant.id}
                    className="h-11 rounded-md border border-border bg-surface px-5 text-sm font-bold text-danger hover:bg-danger-bg disabled:opacity-60"
                  >
                    不承認
                  </button>
                </div>
              )}
            </section>
          ))
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-sm bg-danger-bg p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-50 rounded-md bg-primary px-4 py-3 text-sm font-bold text-on-primary shadow-card"
        >
          LINEに通知しました（デモ）
        </div>
      )}
    </>
  );
}
