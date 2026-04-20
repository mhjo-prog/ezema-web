-- wellness_post_feedback 테이블: 웰니스 게시물별 피드백 및 수정 이력 관리
create table if not exists wellness_post_feedback (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid references wellness_posts(id) on delete set null,
  wellness_category text not null,
  title             text not null,
  original_content  text not null,
  edited_content    text,
  feedback_score    smallint check (feedback_score between 1 and 5),
  feedback_note     text,
  view_count        integer,
  created_at        timestamptz not null default now()
);
