# FARMATE デモ — プロジェクト指示書

農家と大学生をつなぐ短期バイトサービス「FARMATE」の**デモ**を作る。
本番ではなく、数分のプレゼンで見せるためのもの。**動くこと・見栄え・デモシナリオが通ること**を優先する。

## 重要な前提（必ず守る）

- このモデルは**画像を読めない**。ロゴ画像は見えない前提で、色・形は `design-tokens.css` の値だけを使う。
- **色を直書きしない。** `#xxxxxx` やTailwindの既定色（`green-500` 等）は使わず、`var(--color-...)` を参照する。
- **DBのテーブル設計・RLSは変更しない。** `supabase/migrations/0001_init.sql` が正。変更が必要そうなら実装せず質問する。
- **外部ネットワークに依存しない。** CDN、Googleフォント、外部画像、外部APIは使わない（会場のネットが不安定でも動かす）。
- 迷ったら**作り込まず、動く最小実装**にする。一度に大量の機能を足さない。

## 技術構成

- Next.js（App Router）+ TypeScript + Tailwind CSS
- DB・認証: ローカルSupabase（`supabase start`）。Supabase Authでログイン
- 起動: `supabase start` → `docker compose up`（アプリは http://localhost:3000）
- フォント: `@fontsource/noto-sans-jp` と `@fontsource/montserrat`（太さ800）をnpmで同梱

## ファイル配置

```
public/brand/farmate-logo.png   ヘッダー・ログイン画面に使う横長ロゴ
public/brand/farmate-icon.png   アイコン単体（正方形）
public/brand/favicon-64.png     ファビコン
design-tokens.css               配色・角丸・フォント。globals.css の先頭で import する
supabase/migrations/0001_init.sql   DBスキーマ（schema.sql をそのまま置く）
supabase/seed.sql                   ダミーデータ（ログイン用に後述の修正が必要）
```

## デザイン方針

- 雰囲気: 明るく、やわらかく、清潔感。自然（緑）と人のつながり（青と橙）。
- 背景は `--color-bg`、カードは `--color-surface` + `--radius-md` + `--shadow-card`。
- ボタンは `--color-primary`（白文字）。ホバーで `--color-primary-hover`。
- **役割の色**: 学生は青（`--color-student`）、農家はオレンジ（`--color-farmer`）。バッジや見出しの帯に使う。
- `--logo-green` などロゴ色は**装飾専用**（太い線・背景の帯・アイコン）。小さい文字には使わない（読めない）。
- 見出しは `--font-heading`（太字）、本文は `--font-body`。
- 文字は最小14px。ボタンは高さ44px以上。スマホ幅（375px）でも崩れないこと。
- ヘッダー左に `farmate-logo.png`（高さ32〜40px）。ブラウザのタブに `favicon-64.png`。

## 画面（デモに必要な最小限）

| 役割 | 画面 |
|---|---|
| 共通 | ログイン（「学生」「農家」「農家（審査待ち）」「運営」のデモ用ボタン） |
| 学生 | 求人一覧 / 求人詳細（詳細住所は「マッチ成立後に表示」） / 応募 / 自分の応募状況 |
| 農家 | 求人登録 / 応募者一覧 / 承認・不承認 |
| 運営 | 農家の審査（承認） / 危険作業求人の承認 |

## デモ用ログイン

- seedのユーザーを固定パスワード `demo1234` で作る（seed.sqlの修正が必要。`extensions.crypt('demo1234', extensions.gen_salt('bf'))` を `encrypted_password` に使う）。
- ログイン画面の4ボタンは、それぞれ次のユーザーでサインインする。
  - 学生: `taro.yamada@s.example-univ.ac.jp`
  - 農家（承認済み・応募者あり）: `tanaka-farm@example.com`
  - 農家（審査待ち）: `kobayashi-orchard@example.com` ← 審査〜承認のデモ用
  - 運営: `admin@example.com`
- 画面右上にいまのユーザー名と役割バッジを出し、切り替えボタンを置く。

## 外部サービスの代用（呼ばない）

- LINE通知 → 画面右下のトースト「LINEに通知しました（デモ）」
- LLM → 使わない（マッチング説明文は固定テキスト）
- 地図 → 静的な枠とエリア名（市区町村）の表示だけ

## 権限まわりで守ること（デモの見せ場）

- 学生は**マッチ成立前、農家の詳細住所・電話を取得できない**（`farm_private` はRLSで拒否される）。画面でも出さない。
- 農家の承認（応募を `accepted` にする）とマッチ作成（`matches` への挿入）は、**サーバー側（Route Handler）で service role を使って**行う。ブラウザから service role キーを使わない。
- 危険作業ありの求人は、運営が承認するまで公開できない（DB制約あり）。

## 完了条件

1. `supabase start` と `docker compose up` だけで起動する
2. 次のシナリオが一通り通る
   1. 「農家（審査待ち）」でログインし、求人登録が「審査中のため登録できません」と出る
   2. 運営でログインし、小林果樹園を承認する
   3. 「農家（審査待ち）」に切り替え、求人を登録できる
   4. 学生が、その求人に応募する
   5. 小林が応募を承認する
   6. 学生の画面で、その求人の詳細住所が見える
3. `rls_check.sql` を流して、期待値どおりの結果になる

## 作業ルール

- 1回の作業は1つの機能まで。終わったら動作確認の手順を書いて止まる。
- 完了していないものを「完了」と書かない。確認できなかった点は正直に書く。
