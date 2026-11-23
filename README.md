# FARMATE デモ

農家と大学生をつなぐ短期バイトサービス「FARMATE」のデモです。
Next.js（App Router）+ TypeScript + Tailwind CSS + ローカル Supabase で動きます。

## 起動手順（`supabase start` → `docker compose up`）

前提: Docker Desktop が起動していること。Supabase CLI は `supabase` または `npx supabase` で実行します。

### 1. Supabase を起動する

```bash
supabase start
# CLI をグローバルに入れていない場合は: npx supabase start
```

`supabase/migrations/0001_init.sql` と `supabase/seed.sql` が自動で適用されます。
初回は Docker イメージの取得に数分かかります。

### 2. 初回だけ `.env` を用意する

```bash
cp .env.example .env
npx supabase status -o env
```

表示された値を `.env` に転記してください。

| `supabase status` の出力 | `.env` の変数名 |
|---|---|
| `ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` |

`NEXT_PUBLIC_SUPABASE_URL` は既定で `http://host.docker.internal:54321` です。
`host.docker.internal` は Docker コンテナからホスト（Windows / Linux 上の Supabase）へ届くためのホスト名です。

> これらのキーはローカル開発専用です。本番環境には使わないでください。

### 3. アプリを起動する

```bash
docker compose up --build
# 2回目以降は: docker compose up
```

http://localhost:3000 を開いてください。

### 停止するとき

```bash
docker compose down
supabase stop
```

## デモ用ログイン

ログイン画面のボタンで、次のアカウントに入れます（パスワードは共通で `demo1234`）。

| ボタン | アカウント | 移動先 |
|---|---|---|
| 学生として入る | `taro.yamada@s.example-univ.ac.jp` | `/student` |
| 農家として入る | `tanaka-farm@example.com` | `/farmer` |
| 農家（審査待ち）として入る | `kobayashi-orchard@example.com` | `/farmer` |
| 運営として入る | `admin@example.com` | `/admin` |

ヘッダー右上の「切り替え」でログイン画面に戻れます。

## Docker まわりのファイル

| ファイル | 内容 |
|---|---|
| `Dockerfile` | 多段ビルド（依存インストール → `npm run build` → 本番起動） |
| `docker-compose.yml` | `app` サービスのみ。ホストの Supabase に `host.docker.internal` で接続 |
| `.env.example` | 環境変数のテンプレート（実キーは `supabase status` で確認） |

`NEXT_PUBLIC_*` は Next.js がビルド時にバンドルへ埋め込むため、`docker-compose.yml` の `build.args` にも渡しています。
`SUPABASE_SERVICE_ROLE_KEY` はサーバー側の Route Handler だけで使い、ブラウザには渡しません。
