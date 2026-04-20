-- Supabase SQL Editor에서 실행하세요
-- wellness_posts 테이블 생성

create table if not exists wellness_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  card_image_url text not null default '',
  wellness_category text not null check (wellness_category in ('수면', '식단', '운동', '명상', '스트레스')),
  status text not null default 'draft' check (status in ('draft', 'approved', 'published')),
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  view_count integer not null default 0
);

-- RLS 활성화
alter table wellness_posts enable row level security;

-- 익명 사용자: 모든 포스트 조회 가능
create policy "All wellness_posts readable by anon"
  on wellness_posts for select
  using (true);

-- 익명 사용자: status 업데이트 가능 (관리자 UI 전용)
create policy "Anon can update wellness_post status"
  on wellness_posts for update
  using (true)
  with check (status in ('draft', 'approved', 'published'));

-- 익명 사용자: 삭제 가능 (관리자 UI 전용)
create policy "Anon can delete wellness_posts"
  on wellness_posts for delete
  using (true);

-- service_role(GitHub Actions)은 INSERT 포함 모든 작업 가능 (RLS 우회)

-- 인덱스
create index if not exists wellness_posts_status_created_at on wellness_posts (status, created_at desc);
create index if not exists wellness_posts_wellness_category on wellness_posts (wellness_category);
