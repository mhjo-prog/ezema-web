-- ============================================================
-- 마이그레이션: wellness_posts에 "향" 카테고리 + source_ids 컬럼 추가
-- 실행 전 반드시 롤백 SQL(migrate-wellness-add-scent-rollback.sql)을 준비할 것
-- Supabase SQL Editor 또는 psql에서 실행
-- ============================================================

-- 1. CHECK constraint 교체
--    Postgres는 constraint를 in-place로 수정할 수 없으므로
--    기존 것을 drop 후 새로 add
ALTER TABLE wellness_posts
  DROP CONSTRAINT IF EXISTS wellness_posts_wellness_category_check;

ALTER TABLE wellness_posts
  ADD CONSTRAINT wellness_posts_wellness_category_check
  CHECK (wellness_category IN ('수면', '식단', '운동', '명상', '스트레스', '향'));

-- 2. source_ids 컬럼 추가 (text 배열, 기존 행은 NULL)
--    PubMed PMID 등 원문 출처 식별자를 배열로 저장
ALTER TABLE wellness_posts
  ADD COLUMN IF NOT EXISTS source_ids text[] DEFAULT NULL;

-- 완료 확인용 조회
SELECT
  conname,
  pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conrelid = 'wellness_posts'::regclass
  AND conname = 'wellness_posts_wellness_category_check';
