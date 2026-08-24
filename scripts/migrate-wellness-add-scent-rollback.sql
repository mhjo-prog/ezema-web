-- ============================================================
-- 롤백: migrate-wellness-add-scent.sql 되돌리기
-- ============================================================

-- 1. CHECK constraint를 "향" 없는 원래 버전으로 복원
ALTER TABLE wellness_posts
  DROP CONSTRAINT IF EXISTS wellness_posts_wellness_category_check;

ALTER TABLE wellness_posts
  ADD CONSTRAINT wellness_posts_wellness_category_check
  CHECK (wellness_category IN ('수면', '식단', '운동', '명상', '스트레스'));

-- 2. source_ids 컬럼 제거
--    주의: 이미 저장된 source_ids 데이터가 있으면 삭제됨
ALTER TABLE wellness_posts
  DROP COLUMN IF EXISTS source_ids;

-- 완료 확인용 조회
SELECT
  conname,
  pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conrelid = 'wellness_posts'::regclass
  AND conname = 'wellness_posts_wellness_category_check';
