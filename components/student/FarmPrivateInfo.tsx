"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";

type FarmPrivateInfoProps = {
  farmId: string;
  hasMatch: boolean;
};

type PrivateInfo = {
  postal_code: string | null;
  address_detail: string;
  phone: string | null;
};

export default function FarmPrivateInfo({
  farmId,
  hasMatch,
}: FarmPrivateInfoProps) {
  const [state, setState] = useState<"loading" | "shown">("loading");
  const [info, setInfo] = useState<PrivateInfo | null>(null);

  useEffect(() => {
    // マッチ成立前は farm_private を取得しようとしない。
    if (!hasMatch) return;
    let cancelled = false;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    async function load() {
      // RLS が許可する（＝この農家とマッチ済みの）場合だけ行が返る。
      const { data } = await supabase
        .from("farm_private")
        .select("postal_code, address_detail, phone")
        .eq("farm_id", farmId)
        .maybeSingle();

      if (cancelled) return;
      if (data) {
        setInfo(data);
        setState("shown");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [farmId, hasMatch]);

  if (!hasMatch) {
    return (
      <section className="rounded-sm bg-bg p-4">
        <h2 className="font-bold text-text">詳細住所</h2>
        <p className="mt-1 leading-7 text-text-muted">
          マッチ成立後に表示されます
        </p>
      </section>
    );
  }

  if (state === "shown" && info) {
    return (
      <section className="rounded-sm bg-tint p-4">
        <h2 className="font-bold text-text">詳細住所・電話</h2>
        <p className="mt-1 break-words text-sm leading-7 text-text">
          〒{info.postal_code ?? "—"} {info.address_detail}
        </p>
        <p className="mt-1 text-sm leading-7 text-text">
          電話: {info.phone ?? "記載なし"}
        </p>
        <p className="mt-2 text-sm text-text-muted">
          住所はマッチ成立後のみ表示されます
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-sm bg-bg p-4">
      <h2 className="font-bold text-text">詳細住所</h2>
      <p className="mt-1 leading-7 text-text-muted">確認中...</p>
    </section>
  );
}
