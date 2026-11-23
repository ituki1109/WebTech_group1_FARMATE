"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type JobFormProps = {
  farmId: string;
  canPost: boolean;
};

const fieldClass =
  "mt-1 h-11 w-full rounded-sm border border-border bg-bg px-3 text-sm text-text";

export default function JobForm({ farmId, canPost }: JobFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [workType, setWorkType] = useState("");
  const [description, setDescription] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [wage, setWage] = useState("1200");
  const [transportNote, setTransportNote] = useState("");
  const [mealProvided, setMealProvided] = useState(false);
  const [hasHazard, setHasHazard] = useState(false);
  const [hazardNote, setHazardNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!canPost) {
      setError("審査中のため登録できません");
      return;
    }

    setBusy(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { error: insertError } = await supabase.from("job_posts").insert({
      farm_id: farmId,
      title,
      work_type: workType,
      description: description || null,
      work_date: workDate,
      start_time: startTime,
      end_time: endTime,
      capacity: Number(capacity),
      hourly_wage_yen: Number(wage),
      transport_note: transportNote || null,
      meal_provided: mealProvided,
      has_hazard: hasHazard,
      hazard_note: hasHazard ? hazardNote || null : null,
      // 危険作業ありは運営承認まで公開できない（DB 制約に合わせる）
      status: hasHazard ? "draft" : "open",
      // hazard_approved_at / hazard_approved_by は運営が設定するので送らない
    });
    setBusy(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push("/farmer");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-md bg-surface p-6 shadow-card"
    >
      {!canPost && (
        <p
          role="alert"
          className="rounded-sm bg-farmer-bg p-3 text-sm text-farmer"
        >
          審査中のため登録できません
        </p>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-bold text-text">
          タイトル
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="workType" className="block text-sm font-bold text-text">
          作業種別（DB 必須項目）
        </label>
        <input
          id="workType"
          required
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
          placeholder="例: 収穫"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-bold text-text">
          作業内容
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-sm border border-border bg-bg p-3 text-sm text-text"
        />
      </div>

      <div>
        <label htmlFor="workDate" className="block text-sm font-bold text-text">
          日付
        </label>
        <input
          id="workDate"
          type="date"
          required
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startTime" className="block text-sm font-bold text-text">
            開始
          </label>
          <input
            id="startTime"
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-bold text-text">
            終了
          </label>
          <input
            id="endTime"
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="capacity" className="block text-sm font-bold text-text">
            募集人数
          </label>
          <input
            id="capacity"
            type="number"
            min={1}
            required
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="wage" className="block text-sm font-bold text-text">
            時給（円）
          </label>
          <input
            id="wage"
            type="number"
            min={1}
            required
            value={wage}
            onChange={(e) => setWage(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="transport" className="block text-sm font-bold text-text">
          送迎・交通
        </label>
        <input
          id="transport"
          value={transportNote}
          onChange={(e) => setTransportNote(e.target.value)}
          placeholder="例: 最寄駅から送迎あり"
          className={fieldClass}
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-text">
        <input
          type="checkbox"
          checked={mealProvided}
          onChange={(e) => setMealProvided(e.target.checked)}
          className="h-5 w-5"
        />
        食事を提供する
      </label>

      <label className="flex items-center gap-3 text-sm text-text">
        <input
          type="checkbox"
          checked={hasHazard}
          onChange={(e) => setHasHazard(e.target.checked)}
          className="h-5 w-5"
        />
        危険作業あり（登録後、運営の承認まで非公開）
      </label>

      {hasHazard && (
        <div>
          <label htmlFor="hazardNote" className="block text-sm font-bold text-text">
            危険作業の説明
          </label>
          <textarea
            id="hazardNote"
            value={hazardNote}
            onChange={(e) => setHazardNote(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-sm border border-border bg-bg p-3 text-sm text-text"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="h-11 w-full rounded-md bg-primary text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
      >
        {busy ? "登録中..." : "求人を登録する"}
      </button>

      {error && (
        <p
          role="alert"
          className="rounded-sm bg-danger-bg p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
    </form>
  );
}
