-- Supabase SQL Editor에서 실행하세요
-- trends 테이블 생성

create table if not exists trends (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  source text not null check (source in ('naver', 'google')),
  score integer not null default 0,
  collected_at timestamptz not null default now()
);

-- RLS 활성화
alter table trends enable row level security;

-- anon은 조회만 가능
create policy "Trends readable by anon"
  on trends for select
  using (true);

-- service_role만 삽입 가능 (GitHub Actions)
-- service_role은 RLS를 우회하므로 별도 정책 불필요

-- 인덱스: 최근 트렌드 빠르게 조회
create index if not exists trends_collected_at on trends (collected_at desc);
create index if not exists trends_source_score on trends (source, score desc);

-- 오래된 트렌드 자동 정리 (30일 이상 된 데이터 삭제)
-- GitHub Actions에서 주기적으로 실행하거나 아래 함수로 수동 실행
create or replace function cleanup_old_trends()
returns void
language sql
as $$
  delete from trends where collected_at < now() - interval '30 days';
$$;
