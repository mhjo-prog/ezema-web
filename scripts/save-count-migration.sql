-- =============================================================
-- 2026-09-18 적용 완료 (Supabase 직접 적용). 재실행 불필요.
-- save_count 컬럼 + bookmarks 트리거 (기록용)
-- 대상: wellness_posts, posts
-- bookmarks.post_type = 'wellness_posts' | 'posts' 에 따라 각 테이블의
-- save_count를 자동 증감한다.
-- =============================================================

-- 1. 컬럼 추가 -------------------------------------------------------
alter table public.wellness_posts
  add column if not exists save_count integer not null default 0;

alter table public.posts
  add column if not exists save_count integer not null default 0;

-- 2. 트리거 함수 ------------------------------------------------------
create or replace function public.sync_bookmark_save_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    if NEW.post_type = 'wellness_posts' then
      update public.wellness_posts
         set save_count = save_count + 1
       where id = NEW.post_id;
    elsif NEW.post_type = 'posts' then
      update public.posts
         set save_count = save_count + 1
       where id = NEW.post_id;
    end if;
    return NEW;

  elsif (TG_OP = 'DELETE') then
    if OLD.post_type = 'wellness_posts' then
      update public.wellness_posts
         set save_count = greatest(save_count - 1, 0)
       where id = OLD.post_id;
    elsif OLD.post_type = 'posts' then
      update public.posts
         set save_count = greatest(save_count - 1, 0)
       where id = OLD.post_id;
    end if;
    return OLD;
  end if;

  return null;
end;
$$;

-- 3. 트리거 등록 -------------------------------------------------------
drop trigger if exists trg_sync_bookmark_save_count on public.bookmarks;

create trigger trg_sync_bookmark_save_count
after insert or delete on public.bookmarks
for each row execute function public.sync_bookmark_save_count();

-- 4. 기존 bookmarks 데이터 백필 ----------------------------------------
-- wellness_posts
update public.wellness_posts wp
   set save_count = (
     select count(*)
       from public.bookmarks b
      where b.post_id = wp.id
        and b.post_type = 'wellness_posts'
   );

-- posts
update public.posts p
   set save_count = (
     select count(*)
       from public.bookmarks b
      where b.post_id = p.id
        and b.post_type = 'posts'
   );
