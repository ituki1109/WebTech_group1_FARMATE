// デモ用ログイン（AGENTS.md の固定アカウント）。メールアドレスはサーバー側でのみ使う。
export const DEMO_PASSWORD = "demo1234";

export const DEMO_ACCOUNTS = {
  student: "taro.yamada@s.example-univ.ac.jp",
  farmer: "tanaka-farm@example.com",
  farmerPending: "kobayashi-orchard@example.com",
  admin: "admin@example.com",
} as const;

export type DemoAccountKey = keyof typeof DEMO_ACCOUNTS;

// profiles.role → 役割トップのパス
export const ROLE_PATH: Record<string, string> = {
  student: "/student",
  farmer: "/farmer",
  admin: "/admin",
};
