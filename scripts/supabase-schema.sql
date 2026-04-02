-- Supabase SQL Editor에서 실행하세요
-- posts 테이블 생성

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  card_image_url text not null default '',
  constitution_type text not null check (constitution_type in ('태음인', '소음인', '태양인', '소양인')),
  status text not null default 'draft' check (status in ('draft', 'approved', 'published')),
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS 활성화
alter table posts enable row level security;

-- 익명 사용자: 모든 포스트 조회 가능 (관리자 페이지 UI는 비밀번호로 보호)
create policy "All posts readable by anon"
  on posts for select
  using (true);

-- 익명 사용자: status 업데이트 가능 (draft → approved, 관리자 UI 전용)
create policy "Anon can update post status"
  on posts for update
  using (true)
  with check (status in ('draft', 'approved', 'published'));

-- service_role(GitHub Actions)은 INSERT 포함 모든 작업 가능 (RLS 우회)

-- 인덱스
create index if not exists posts_status_created_at on posts (status, created_at desc);
create index if not exists posts_constitution_type on posts (constitution_type);
