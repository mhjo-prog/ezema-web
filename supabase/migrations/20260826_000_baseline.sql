-- =============================================================
-- Baseline: feature/survey-v2 도입 직전 프로덕션 스키마
-- CLI(supabase db pull) 불가 시점에 코드 분석으로 재구성.
-- 프로덕션에 이미 존재하므로 CREATE는 IF NOT EXISTS로 방어.
-- =============================================================

-- ------------------------------------------------------------------
-- 1. kakao_users — 로그인 사용자 (PK: kakao_id)
-- ------------------------------------------------------------------
create table if not exists public.kakao_users (
  kakao_id      text        primary key,
  nickname      text        not null,
  profile_image text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 2. scent_results — 향 추천 응답 (v1)
--    실제 프로덕션 PK는 uuid (대시보드 직접 생성).
-- ------------------------------------------------------------------
create table if not exists public.scent_results (
  id           uuid        primary key default gen_random_uuid() not null,
  kakao_id     text        not null,
  scent_type   text        not null,
  scores       jsonb       not null default '{}'::jsonb,
  facet_scores jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 3. quiz_results — 사상체질 검사 응답
-- ------------------------------------------------------------------
create table if not exists public.quiz_results (
  id               uuid        primary key default gen_random_uuid(),
  kakao_id         text        not null,
  constitution_type text       not null,
  scores           jsonb,
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 4. posts — 사상체질 콘텐츠
-- ------------------------------------------------------------------
create table if not exists public.posts (
  id                uuid        primary key default gen_random_uuid(),
  title             text        not null,
  content           text        not null,
  constitution_type text,
  card_image_url    text,
  status            text        not null default 'draft',
  scheduled_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 5. post_feedback — 사상체질 콘텐츠 피드백
-- ------------------------------------------------------------------
create table if not exists public.post_feedback (
  id               uuid        primary key default gen_random_uuid(),
  post_id          uuid        not null references public.posts(id) on delete cascade,
  constitution_type text,
  feedback_score   smallint,
  feedback_note    text,
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 6. wellness_posts — 웰니스 콘텐츠
-- ------------------------------------------------------------------
create table if not exists public.wellness_posts (
  id                  uuid        primary key default gen_random_uuid(),
  title               text        not null,
  content             text        not null,
  wellness_category   text,
  card_image_url      text,
  content_image_url   text,
  status              text        not null default 'draft',
  scheduled_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 7. wellness_post_feedback — 웰니스 콘텐츠 피드백
-- ------------------------------------------------------------------
create table if not exists public.wellness_post_feedback (
  id               uuid        primary key default gen_random_uuid(),
  post_id          uuid        not null references public.wellness_posts(id) on delete cascade,
  feedback_score   smallint,
  feedback_note    text,
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 8. bookmarks — 북마크 (posts + wellness_posts 통합)
-- ------------------------------------------------------------------
create table if not exists public.bookmarks (
  id         uuid        primary key default gen_random_uuid(),
  kakao_id   text        not null,
  post_id    uuid        not null,
  post_type  text        not null,  -- 'sasang' | 'wellness'
  created_at timestamptz not null default now(),
  unique (kakao_id, post_id)
);

-- ------------------------------------------------------------------
-- 9. analytics — 페이지/이벤트 트래킹
-- ------------------------------------------------------------------
create table if not exists public.analytics (
  id               uuid        primary key default gen_random_uuid(),
  event_type       text        not null,
  constitution_type text,
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 10. trends — 크롤링 트렌드 키워드 (30일 자동 정리)
-- ------------------------------------------------------------------
create table if not exists public.trends (
  id           uuid        primary key default gen_random_uuid(),
  keyword      text        not null,
  source       text        not null check (source in ('naver', 'google')),
  score        integer     not null default 0,
  collected_at timestamptz not null default now()
);

create index if not exists trends_collected_at on public.trends (collected_at desc);
create index if not exists trends_source_score on public.trends (source, score desc);

-- ------------------------------------------------------------------
-- 11. research_docs — 사상체질 연구 문서
-- ------------------------------------------------------------------
create table if not exists public.research_docs (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null,
  category         text,
  constitution_type text,
  content          text        not null,
  created_at       timestamptz default now()
);
