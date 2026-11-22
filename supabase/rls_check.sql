-- =====================================================================
-- RLS動作確認（SQL Editor等で、schema.sql と seed.sql の実行後に実行）
-- 各ブロックは begin ... rollback で完結し、データは変更されません
-- =====================================================================

-- 1) 山田太郎(学生)は、マッチ済みの山本ファームの住所だけ見える → 期待: 1行
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  select f.farm_name, p.address_detail
  from farm_profiles f join farm_private p on p.farm_id = f.user_id;
rollback;

-- 2) 高橋美咲(学生)はマッチなし → 期待: 0行（住所は一切見えない）
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
  select count(*) as private_rows from farm_private;
rollback;

-- 3) 学生は審査中の農家(小林果樹園)を一覧で見られない → 期待: 田中・山本の2行
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  select farm_name from farm_profiles order by farm_name;
rollback;

-- 4) 学生は下書き求人（農業機械の運搬補助）を見られない → 期待: 全6件のうち draft を除く5件
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  select title, status from job_posts order by work_date;
rollback;

-- 5) 田中農園(農家)は、自分の求人への応募者の名前だけ見える → 期待: 応募した学生3名（山田・佐藤・鈴木）
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    '{"sub":"f0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  select display_name from profiles where role = 'student' order by display_name;
rollback;

-- 6) 学生が自分で role を admin に変更しようとする → 期待: permission denied
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  update profiles set role = 'admin' where id = 'a0000000-0000-0000-0000-000000000001';
rollback;

-- 7) 18歳以上未確認の伊藤蓮(学生)が応募しようとする → 期待: RLS違反でエラー
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
  insert into applications (job_id, student_id)
  values ('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000005');
rollback;

-- 8) 学生が audit_logs を読もうとする → 期待: 0行
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  select count(*) as audit_rows from audit_logs;
rollback;
