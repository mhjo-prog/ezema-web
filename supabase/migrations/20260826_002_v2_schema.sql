-- =============================================================
-- Migration 002: v2 스키마 신설
-- responses, recommendations, scent_feedback,
-- user_baselines, cohort_stats, daily_checkins
--
-- 사용자 식별: 별도 users 테이블 없이 기존 kakao_users를 그대로 사용.
-- kakao_users에 uuid 컬럼(id)만 추가한다.
-- 로그인 플로우(PK kakao_id)는 건드리지 않는다.
-- =============================================================

-- ------------------------------------------------------------------
-- 0. kakao_users에 uuid id 추가 (신규 테이블의 user_id 참조용)
-- ------------------------------------------------------------------
alter table public.kakao_users
  add column if not exists id uuid not null default gen_random_uuid();

create unique index if not exists kakao_users_id_key
  on public.kakao_users(id);

-- ------------------------------------------------------------------
-- 1. responses (익명 포함 — user_id / anon_id 중 하나는 NOT NULL)
-- user_id는 kakao_users.id를 참조한다 (kakao_id가 아님)
-- ------------------------------------------------------------------
create table if not exists public.responses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.kakao_users(id) on delete set null,
  anon_id        text,                              -- localStorage uuid, 로그인 후 null 처리
  survey_version text not null references public.survey_versions(version),
  submitted_at   timestamptz not null default now(),
  weekday        smallint not null,                 -- 0(일)~6(토), 요일 편향 보정
  timezone       text not null default 'Asia/Seoul',
  duration_ms    integer,                           -- 응답 소요시간(ms)
  item_scores    jsonb not null,                    -- { "Q1": 3, "Q2": 1, ... }
  axis_raw       jsonb not null,                    -- { "숙면": 9, "이완": 6, ... }
  axis_z_between jsonb,                             -- 코호트 통계 부재 시 null
  axis_z_within  jsonb,                             -- 관측 3개 미만이면 null
  flags          jsonb,                             -- { straightlining: bool, tooFast: bool }
  -- Part B 응답
  preferred_categories  text[],                     -- Q16: 선호 향 계열
  avoided_categories    text[],                     -- Q17: 비선호 향 계열
  usage_space           text,                       -- Q18: 사용 공간
  safety_flags          text[],                     -- Q19: 안전 플래그
  age_group             text,                       -- Q20: 연령대
  -- 제약: user_id와 anon_id 중 최소 하나는 NOT NULL
  constraint responses_identity_check check (
    user_id is not null or anon_id is not null
  )
);

create index if not exists responses_user_id_idx   on public.responses(user_id);
create index if not exists responses_anon_id_idx   on public.responses(anon_id);
create index if not exists responses_submitted_idx on public.responses(submitted_at);

-- ------------------------------------------------------------------
-- 2. recommendations
-- ------------------------------------------------------------------
create table if not exists public.recommendations (
  id               uuid primary key default gen_random_uuid(),
  response_id      uuid not null references public.responses(id) on delete cascade,
  primary_axis     text not null,
  tie_break_reason text,
  scent_ids        text[] not null,
  filtered_out     jsonb,
  applied_filters  jsonb,
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 3. scent_feedback (개인화 학습의 유일한 입력)
-- ------------------------------------------------------------------
create table if not exists public.scent_feedback (
  id                uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  scent_id          text not null,
  used              boolean not null,
  satisfaction      smallint check (satisfaction between 1 and 5), -- used=true일 때만
  logged_at         timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 4. user_baselines (로그인 사용자만, 개인 기준선 캐시)
-- kakao_users.id를 PK/FK로 사용
-- ------------------------------------------------------------------
create table if not exists public.user_baselines (
  user_id     uuid primary key references public.kakao_users(id) on delete cascade,
  baseline    jsonb not null,   -- { "숙면": 8.5, "이완": 7.0, ... }
  sd_within   jsonb,            -- 관측 3개 이상일 때만
  n_responses integer not null default 0,
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 5. cohort_stats (배치 갱신, 200건 이상에서 신뢰)
-- ------------------------------------------------------------------
create table if not exists public.cohort_stats (
  survey_version text not null references public.survey_versions(version),
  axis           text not null,
  mean           numeric not null,
  sd             numeric not null,
  n              integer not null,
  updated_at     timestamptz not null default now(),
  primary key (survey_version, axis)
);

-- ------------------------------------------------------------------
-- 6. daily_checkins (정식 검사와 절대 섞지 않음)
-- ------------------------------------------------------------------
create table if not exists public.daily_checkins (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references public.kakao_users(id) on delete set null,
  anon_id   text,
  mood      smallint not null check (mood between 1 and 5),
  logged_at timestamptz not null default now(),
  constraint checkins_identity_check check (
    user_id is not null or anon_id is not null
  )
);

-- ------------------------------------------------------------------
-- 7. v2를 활성 버전으로 설정
-- ------------------------------------------------------------------
update public.survey_versions set is_active = true  where version = 'v2';
update public.survey_versions set is_active = false where version = 'v1';
