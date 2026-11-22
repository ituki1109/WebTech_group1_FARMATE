# opencode に貼るプロンプト（順番に1つずつ）

使い方
- プロジェクトのフォルダでopencodeを起動する。`AGENTS.md` は自動で読み込まれる。
- 1つ貼る → AIが終わる → **自分で動作確認** → 次へ。まとめて貼らない。
- 失敗したら、エラー文をそのまま貼って「原因を調べて直して」と伝える。
- 見た目の確認は、**自分の目でブラウザを見て**言葉で指示する（このモデルは画像を読めない）。
  例: 「ヘッダーのロゴが小さい。高さを40pxに」「カードの角をもっと丸く」

---

## 0. 準備（人間がやる）

```
Docker Desktop / Node.js 20以上 / Supabase CLI を入れる。
このキット(AGENTS.md, PROMPTS.md, design-tokens.css, public/brand, supabase/)をプロジェクトの
フォルダに置く。メモリは Docker に 4GB 以上割り当てる。
```

## 1. 土台とデザイン

```
AGENTS.md と design-tokens.css を読んで。
Next.js(App Router, TypeScript, Tailwind) のプロジェクトをこのフォルダに作って。
- design-tokens.css を globals.css の先頭で import する
- @fontsource/noto-sans-jp と @fontsource/montserrat(800) をインストールして読み込む。外部CDNは使わない
- Tailwind の色は design-tokens.css の変数を参照するように theme を設定する
- 共通ヘッダーを作る。左に public/brand/farmate-logo.png(高さ36px)、右にユーザー名と役割バッジの置き場所
- favicon に public/brand/favicon-64.png
- トップページには「FARMATE」の簡単な紹介と、ログインへのボタンだけ置く
終わったら確認方法を書いて止まって。
```

確認: `npm run dev` で http://localhost:3000 を開き、ロゴ・緑のボタン・背景色が出る。

## 2. ローカルSupabaseとログイン確認（最重要）

```
supabase init をして、supabase/migrations/0001_init.sql と supabase/seed.sql を使う(すでに置いてある)。
supabase start を実行して、schema と seed が適用されることを確認して。
その後、psql か supabase の API で、taro.yamada@s.example-univ.ac.jp / demo1234 で
メールログインできるか確認して。
ログインできない場合は、seed.sql の末尾近くの「デモ用ログインのための補完」を見直して原因を直して。
テーブル設計(0001_init.sql)は変更しないこと。
```

確認: ログインが通る（この手順が一番つまずきやすい。通らないままUIを作らない）。

## 3. ログイン画面

```
ログイン画面を作って。
- 「学生として入る」「農家として入る」「農家（審査待ち）として入る」「運営として入る」の4ボタン
- それぞれ AGENTS.md に書いたユーザーで Supabase Auth にサインインし、役割ごとのトップへ移動
- ヘッダー右に現在のユーザー名と役割バッジ(学生は青、農家はオレンジ)と「切り替え」ボタン
- 未ログインで役割ページを開いたらログイン画面へ戻す
```

## 4. 学生の画面

```
学生の画面を作って。
- 求人一覧: カード表示。タイトル、農園名、市区町村、日付、時給、募集人数、「送迎あり」などのバッジ
- 求人詳細: 内容、持ち物、送迎。詳細住所は出さず「マッチ成立後に表示されます」と表示
- 応募ボタン: applications に insert(Supabaseのクライアント経由。RLSに任せる)
- 応募状況ページ: 自分の応募と状態(応募中/承認/不承認/取り下げ)
データはすべてDBから取得する。固定のダミーを画面に直書きしない。
```

## 5. 農家の画面

```
農家の画面を作って。
- 求人登録フォーム(タイトル、作業内容、日付、時間、人数、時給、送迎、食事、危険作業の有無と説明)
- 自分の求人一覧と、各求人の応募者一覧(学生の表示名、大学、学部、体力レベル、メッセージ)
- 「承認」「不承認」ボタン
- 承認時は Route Handler(サーバー側)で service role を使い、applications を accepted にして
  matches を作成する。service role キーはブラウザに渡さない
- 承認したら画面右下に「LINEに通知しました（デモ）」のトーストを出す
```

## 6. 運営の画面

```
運営の画面を作って。
- 農家の審査: 審査中(pending)の農家一覧と「承認」ボタン。承認で verify_status を verified にする
  (service role を使うサーバー側処理で行い、audit_logs にも記録する)
- 危険作業の承認: has_hazard=true で hazard_approved_at が空の求人を一覧し、「承認して公開」ボタン
- 通報一覧(読み取りのみ)
```

## 7. 住所が見える演出

```
学生の求人詳細ページを直して。
- ログイン中の学生が、その求人の農園とマッチ成立していれば、farm_private から
  詳細住所・電話を取得して表示する(クライアント経由。RLSで許可された場合だけ取れる)
- マッチ成立前は取得を試さず「マッチ成立後に表示されます」を出す
- 取得できた場合は「住所はマッチ成立後のみ表示されます」と補足する小さな注意書きを付ける
```

## 8. Dockerで起動できる形にする

```
docker compose up だけでアプリが起動するようにして。
- Dockerfile(Next.js, 本番ビルド)と docker-compose.yml を作る
- アプリは Supabase の URL と anon key、service role key を環境変数で受け取る
  (.env.example を作る。実際のキーは supabase status で確認できると README に書く)
- Docker内のアプリからホストの Supabase に届くように、URL を host.docker.internal 等で設定する
- README に、起動手順を「supabase start → docker compose up」で書く
```

## 9. 通し確認

```
AGENTS.md の「完了条件」のシナリオ(6手順)を順に実行して確認して。
うまくいかなかった箇所と原因、直した内容を報告して。
最後に supabase/rls_check.sql を流して、期待値と合っているか確認して。
```

## 10. 仕上げ（人間）

- スマホ幅（ブラウザの幅375px）で崩れていないか見る
- **画面録画を撮る**（当日のトラブル対策）
- 起動手順を2回通して、毎回同じ結果になるか確認する
