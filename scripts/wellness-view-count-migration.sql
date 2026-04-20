-- wellness_posts 테이블에 view_count 컬럼 추가
alter table wellness_posts add column if not exists view_count integer not null default 0;
