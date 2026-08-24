-- Supabase SQL Editor에서 실행하세요
-- 향 체질 검사 결과 저장 테이블

create table if not exists scent_results (
  id uuid primary key default gen_random_uuid(),
  kakao_id text not null,
  scent_type text not null check (scent_type in ('이완', '숙면', '활력', '몰입', '청정')),
  scores jsonb not null default '{}',
  facet_scores jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- RLS 활성화
alter table scent_results enable row level security;

-- 익명 포함 모든 역할: 삽입/조회/삭제 가능 (quiz_results와 동일 패턴)
create policy "Anon can insert scent_results"
  on scent_results for insert
  with check (true);

create policy "Anon can select scent_results"
  on scent_results for select
  using (true);

create policy "Anon can delete scent_results"
  on scent_results for delete
  using (true);

-- kakao_id 기준 조회 인덱스
create index if not exists scent_results_kakao_id_created_at
  on scent_results (kakao_id, created_at desc);
