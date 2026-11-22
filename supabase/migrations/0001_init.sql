-- =====================================================================
-- 農家 x 学生 短期バイト マッチング  MVP用 DBスキーマ (Supabase / PostgreSQL)
-- 方針: 個人情報の最小化 / 詳細住所はマッチング成立後のみ参照 / RLSで強制
-- 注意: 設計案です。本番投入前にレビューとテストを行ってください。
-- =====================================================================

-- ---------- 列挙型 ----------
create type user_role           as enum ('student', 'farmer', 'admin');
create type farm_verify_status  as enum ('pending', 'verified', 'rejected');
create type job_status          as enum ('draft', 'open', 'filled', 'closed', 'cancelled');
create type application_status  as enum ('applied', 'accepted', 'rejected', 'withdrawn', 'completed');
create type report_status       as enum ('open', 'reviewing', 'resolved', 'dismissed');

-- ---------- テーブル ----------

-- 学生として登録できる大学メールのドメイン許可リスト
create table allowed_email_domains (
  domain text primary key check (domain = lower(domain))
);

-- 共通プロフィール（auth.users と1:1）。role は運営のみ変更可
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         user_role not null,
  display_name text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz            -- 退会（匿名化）日時
);

create table student_profiles (
  user_id            uuid primary key references profiles(id) on delete cascade,
  university         text not null,
  faculty            text,
  grad_year          smallint check (grad_year between 2025 and 2040),
  is_adult_confirmed boolean not null default false,  -- 18歳以上の確認（初期は18歳以上限定）
  home_area          text,                            -- 市区町村まで。詳細住所は持たない
  stamina_level      smallint check (stamina_level between 1 and 5),
  skills             text[] not null default '{}',
  bio                text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 農家の公開情報（概略位置のみ）
create table farm_profiles (
  user_id       uuid primary key references profiles(id) on delete cascade,
  farm_name     text not null,
  prefecture    text not null,
  city          text not null,
  crops         text[] not null default '{}',
  intro         text,
  verify_status farm_verify_status not null default 'pending',  -- 運営の目視確認
  verified_at   timestamptz,
  verified_by   uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 農家の非公開情報（詳細住所・電話）。マッチング成立後のみ学生が参照可
create table farm_private (
  farm_id        uuid primary key references farm_profiles(user_id) on delete cascade,
  postal_code    text,
  address_detail text not null,
  phone          text,
  lat            double precision,
  lng            double precision,
  updated_at     timestamptz not null default now()
);

create table job_posts (
  id                 uuid primary key default gen_random_uuid(),
  farm_id            uuid not null references farm_profiles(user_id),
  title              text not null,
  description        text,
  work_type          text not null,                 -- 収穫 / 梱包 / 定植 など
  work_date          date not null,
  start_time         time not null,
  end_time           time not null,
  capacity           smallint not null check (capacity > 0),
  hourly_wage_yen    integer  not null check (hourly_wage_yen > 0),
  transport_note     text,                          -- 交通費・送迎
  lodging_note       text,                          -- 宿泊（初期は日帰り）
  meal_provided      boolean not null default false,
  has_hazard         boolean not null default false, -- 機械操作などの危険作業
  hazard_note        text,
  hazard_approved_at timestamptz,                    -- 運営の承認（承認なしでは公開不可）
  hazard_approved_by uuid references profiles(id),
  status             job_status not null default 'draft',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (end_time > start_time),
  check (not (status = 'open' and has_hazard and hazard_approved_at is null))
);

create table applications (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references job_posts(id) on delete cascade,
  student_id uuid not null references student_profiles(user_id),
  status     application_status not null default 'applied',
  message    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, student_id)
);

-- マッチング成立（サーバー側 service role のみが作成する）
create table matches (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references applications(id),
  job_id         uuid not null references job_posts(id),
  student_id     uuid not null references student_profiles(user_id),
  farm_id        uuid not null references farm_profiles(user_id),
  confirmed_at   timestamptz not null default now(),
  completed_at   timestamptz,
  fee_yen        integer check (fee_yen >= 0),     -- 農家への手数料（請求書払い）
  invoiced_at    timestamptz
);

create table reviews (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references matches(id),
  reviewer_id uuid not null references profiles(id),
  reviewee_id uuid not null references profiles(id),
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (match_id, reviewer_id),
  check (reviewer_id <> reviewee_id)
);

create table reports (
  id             uuid primary key default gen_random_uuid(),
  reporter_id    uuid not null references profiles(id),
  target_user_id uuid references profiles(id),
  job_id         uuid references job_posts(id),
  category       text not null,
  detail         text not null,
  status         report_status not null default 'open',
  resolved_by    uuid references profiles(id),
  resolved_at    timestamptz,
  created_at     timestamptz not null default now()
);

create table user_blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- 管理者の閲覧・変更の記録（書き込みはアプリサーバーの service role のみ）
create table audit_logs (
  id         bigint generated always as identity primary key,
  actor_id   uuid,
  action     text not null,
  table_name text not null,
  record_id  text,
  detail     jsonb,
  created_at timestamptz not null default now()
);

-- ---------- インデックス ----------
create index idx_job_posts_status_date on job_posts (status, work_date);
create index idx_job_posts_farm        on job_posts (farm_id);
create index idx_applications_student  on applications (student_id);
create index idx_applications_job      on applications (job_id);
create index idx_matches_student       on matches (student_id);
create index idx_matches_farm          on matches (farm_id);
create index idx_reviews_reviewee      on reviews (reviewee_id);
create index idx_reports_status        on reports (status);

-- ---------- updated_at 自動更新 ----------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','student_profiles','farm_profiles','farm_private','job_posts','applications']
  loop
    execute format('create trigger trg_%s_updated before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- ---------- 新規登録時に profiles を作成 ----------
-- role は 'farmer' 以外すべて student 扱い（metadataで admin を名乗れないようにする）
-- 学生は許可リストの大学メールドメインのみ登録可
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_role user_role;
begin
  v_role := case when new.raw_user_meta_data->>'role' = 'farmer'
                 then 'farmer'::user_role else 'student'::user_role end;

  if v_role = 'student' and not exists (
    select 1 from allowed_email_domains d
    where lower(coalesce(new.email, '')) like ('%@' || d.domain)
       or lower(coalesce(new.email, '')) like ('%.' || d.domain)
  ) then
    raise exception 'university email domain is not allowed';
  end if;

  insert into profiles (id, role, display_name)
  values (new.id, v_role, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- RLS 用ヘルパー関数 ----------
-- security definer にして、RLSの再帰参照を避ける
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin' and deleted_at is null
  )
$$;

-- 自分(学生)が、その農家とマッチ済みか
create or replace function has_match_with_farm(p_farm uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matches where farm_id = p_farm and student_id = auth.uid()
  )
$$;

-- 自分(農家)の求人に、その学生が応募しているか
create or replace function farm_sees_student(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from applications a join job_posts j on j.id = a.job_id
    where a.student_id = p_student and j.farm_id = auth.uid()
  )
$$;

-- 退会時の匿名化（service role のみ実行）
create or replace function anonymize_user(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update profiles set display_name = '退会済みユーザー', deleted_at = now() where id = p_user;
  update student_profiles
     set university = '退会済み', faculty = null, home_area = null, skills = '{}', bio = null
   where user_id = p_user;
  update farm_profiles set farm_name = '退会済み', intro = null where user_id = p_user;
  delete from farm_private where farm_id = p_user;
end $$;
revoke execute on function anonymize_user(uuid) from public, anon, authenticated;

-- ---------- 列単位の更新権限（権限昇格の防止）----------
revoke update on profiles from authenticated;
grant  update (display_name) on profiles to authenticated;

revoke update on farm_profiles from authenticated;
grant  update (farm_name, prefecture, city, crops, intro) on farm_profiles to authenticated;

revoke update on job_posts from authenticated;
grant  update (title, description, work_type, work_date, start_time, end_time, capacity,
               hourly_wage_yen, transport_note, lodging_note, meal_provided,
               has_hazard, hazard_note, status)
  on job_posts to authenticated;

revoke update on applications from authenticated;
grant  update (status) on applications to authenticated;

-- ---------- RLS 有効化 ----------
alter table allowed_email_domains enable row level security;  -- ポリシーなし = 全拒否
alter table profiles          enable row level security;
alter table student_profiles  enable row level security;
alter table farm_profiles     enable row level security;
alter table farm_private      enable row level security;
alter table job_posts         enable row level security;
alter table applications      enable row level security;
alter table matches           enable row level security;
alter table reviews           enable row level security;
alter table reports           enable row level security;
alter table user_blocks       enable row level security;
alter table audit_logs        enable row level security;

-- ---------- RLS ポリシー ----------

-- profiles: 本人 / 運営 / 自分の求人に応募した学生を見る農家
create policy profiles_select on profiles for select to authenticated
  using (id = auth.uid() or is_admin() or farm_sees_student(id));
create policy profiles_update_own on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- student_profiles
create policy sp_select on student_profiles for select to authenticated
  using (user_id = auth.uid() or is_admin() or farm_sees_student(user_id));
create policy sp_insert on student_profiles for insert to authenticated
  with check (user_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and role = 'student'));
create policy sp_update on student_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- farm_profiles: 承認済みは全員に公開、未承認は本人と運営のみ
create policy fp_select on farm_profiles for select to authenticated
  using (verify_status = 'verified' or user_id = auth.uid() or is_admin());
create policy fp_insert on farm_profiles for insert to authenticated
  with check (user_id = auth.uid() and verify_status = 'pending'
    and exists (select 1 from profiles where id = auth.uid() and role = 'farmer'));
create policy fp_update on farm_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- farm_private: 本人 / 運営 / マッチ成立済みの学生のみ
create policy fpv_select on farm_private for select to authenticated
  using (farm_id = auth.uid() or is_admin() or has_match_with_farm(farm_id));
create policy fpv_insert on farm_private for insert to authenticated
  with check (farm_id = auth.uid());
create policy fpv_update on farm_private for update to authenticated
  using (farm_id = auth.uid()) with check (farm_id = auth.uid());

-- job_posts: 下書き・中止は本人と運営のみ。投稿は承認済み農家のみ
create policy jp_select on job_posts for select to authenticated
  using (status in ('open', 'filled', 'closed') or farm_id = auth.uid() or is_admin());
create policy jp_insert on job_posts for insert to authenticated
  with check (farm_id = auth.uid()
    and hazard_approved_at is null and hazard_approved_by is null
    and exists (select 1 from farm_profiles f
                where f.user_id = auth.uid() and f.verify_status = 'verified'));
create policy jp_update on job_posts for update to authenticated
  using (farm_id = auth.uid()) with check (farm_id = auth.uid());

-- applications: 応募は18歳以上確認済みの学生が、公開中の求人にのみ
create policy app_select on applications for select to authenticated
  using (student_id = auth.uid() or is_admin()
    or exists (select 1 from job_posts j where j.id = job_id and j.farm_id = auth.uid()));
create policy app_insert on applications for insert to authenticated
  with check (student_id = auth.uid() and status = 'applied'
    and exists (select 1 from student_profiles s
                where s.user_id = auth.uid() and s.is_adult_confirmed)
    and exists (select 1 from job_posts j where j.id = job_id and j.status = 'open'));
create policy app_update_student on applications for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid() and status = 'withdrawn');
create policy app_update_farm on applications for update to authenticated
  using (exists (select 1 from job_posts j where j.id = job_id and j.farm_id = auth.uid()))
  with check (status in ('accepted', 'rejected'));

-- matches: 参照のみ（作成・更新はサーバーの service role）
create policy m_select on matches for select to authenticated
  using (student_id = auth.uid() or farm_id = auth.uid() or is_admin());

-- reviews: 完了したマッチの当事者同士のみ
create policy r_select on reviews for select to authenticated
  using (reviewer_id = auth.uid() or reviewee_id = auth.uid() or is_admin());
create policy r_insert on reviews for insert to authenticated
  with check (reviewer_id = auth.uid()
    and exists (
      select 1 from matches m
      where m.id = match_id and m.completed_at is not null
        and ((m.student_id = auth.uid() and m.farm_id = reviewee_id)
          or (m.farm_id = auth.uid() and m.student_id = reviewee_id))));

-- reports
create policy rp_select on reports for select to authenticated
  using (reporter_id = auth.uid() or is_admin());
create policy rp_insert on reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');
create policy rp_update_admin on reports for update to authenticated
  using (is_admin()) with check (is_admin());

-- user_blocks
create policy ub_select on user_blocks for select to authenticated using (blocker_id = auth.uid());
create policy ub_insert on user_blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy ub_delete on user_blocks for delete to authenticated using (blocker_id = auth.uid());

-- audit_logs: 運営のみ閲覧
create policy al_select on audit_logs for select to authenticated using (is_admin());
