-- =============================================================
-- Migration 004: post_feedback INSERT / UPDATE RLS 정책 추가
-- wellness_post_feedback 와 동일한 정책 구조로 맞춤
-- 누락 원인: Typology Stories 탭 "피드백 저장" 실패 버그 수정
-- =============================================================

CREATE POLICY "allow public insert post feedback"
  ON public.post_feedback
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "allow public update post feedback"
  ON public.post_feedback
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
