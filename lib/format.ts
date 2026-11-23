export function formatWorkDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value));
}

export function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : "—";
}

export function formatYen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export function hasPickup(note: string | null) {
  return !!note && note.includes("送迎") && !note.includes("送迎なし");
}

export const applicationStatusLabel: Record<string, string> = {
  applied: "応募中",
  accepted: "承認",
  rejected: "不承認",
  withdrawn: "取り下げ",
  completed: "完了",
};

export const applicationStatusClass: Record<string, string> = {
  applied: "bg-tint text-primary",
  accepted: "bg-tint text-success",
  rejected: "bg-danger-bg text-danger",
  withdrawn: "bg-bg text-text-muted",
  completed: "bg-tint text-primary",
};

export const reportStatusLabel: Record<string, string> = {
  open: "受付中",
  reviewing: "確認中",
  resolved: "解決",
  dismissed: "却下",
};
