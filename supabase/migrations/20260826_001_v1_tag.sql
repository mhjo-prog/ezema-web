-- =============================================================
-- Migration 001: 기존 scent_results에 survey_version = 'v1' 태깅
-- v1 정의를 survey_versions 테이블에 저장
-- 반드시 002 이전에 실행할 것
-- =============================================================

-- 설문 버전 테이블
create table if not exists public.survey_versions (
  version     text primary key,
  definition  jsonb not null,
  released_at timestamptz not null,
  is_active   boolean not null default false
);

-- v1 정의 삽입 (문항 하드코딩 상태를 JSON으로 보존)
insert into public.survey_versions (version, definition, released_at, is_active)
values (
  'v1',
  '{
    "note": "2026-08-26 이전 기존 설문. 5축 × 4문항, 배점 a=4..d=1, 최저점 축 추천.",
    "axes": ["이완","숙면","활력","몰입","청정"],
    "questions": 20,
    "scoring": "lowest_axis_wins"
  }'::jsonb,
  '2025-01-01T00:00:00Z',
  false
)
on conflict (version) do nothing;

-- 기존 scent_results에 survey_version 컬럼 추가 및 v1 부여
alter table public.scent_results
  add column if not exists survey_version text references public.survey_versions(version) default 'v1';

update public.scent_results
set survey_version = 'v1'
where survey_version is null;

-- v2 정의 삽입 (v2 활성화는 002에서)
insert into public.survey_versions (version, definition, released_at, is_active)
values (
  'v2',
  '{
    "note": "2026-08-26 개편. 5축 × 3문항(Part A) + 취향·안전 5문항(Part B), 배점 a=1..d=4, 최고점 축 추천.",
    "axes": ["숙면","이완","활력","몰입","청정"],
    "partA": 15,
    "partB": 5,
    "scoring": "highest_axis_wins",
    "reverse_questions": ["Q3","Q8","Q9","Q11","Q15"]
  }'::jsonb,
  '2026-08-26T00:00:00Z',
  false
)
on conflict (version) do nothing;
