-- =============================================================
-- Migration 003: 익명 → 로그인 병합 정책
-- anon_id당 1회만 병합 허용하기 위한 merged_anon_ids 추적 테이블
-- =============================================================

-- 이미 병합된 anon_id 목록 (재병합 방지)
create table if not exists public.merged_anon_ids (
  anon_id    text primary key,
  user_id    uuid not null references public.kakao_users(id) on delete cascade,
  merged_at  timestamptz not null default now()
);

-- 병합 함수: anon_id의 responses를 user_id로 이전
-- 사용법: select merge_anon_responses('anon-uuid-here', 'user-uuid-here');
create or replace function public.merge_anon_responses(
  p_anon_id text,
  p_user_id uuid
) returns integer
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  -- 이미 병합된 anon_id인지 확인
  if exists (select 1 from public.merged_anon_ids where anon_id = p_anon_id) then
    return 0; -- 재병합 불허
  end if;

  -- responses 업데이트
  update public.responses
  set user_id  = p_user_id,
      anon_id  = null
  where anon_id = p_anon_id
    and user_id is null;

  get diagnostics v_count = row_count;

  -- 병합 기록 (건수 0이어도 기록 — 빈 anon_id 재시도 방지)
  insert into public.merged_anon_ids (anon_id, user_id)
  values (p_anon_id, p_user_id)
  on conflict (anon_id) do nothing;

  return v_count;
end;
$$;
