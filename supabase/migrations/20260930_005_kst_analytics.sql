-- =============================================================
-- Migration 005: analytics RPC 함수 KST(Asia/Seoul) 기준으로 교체
--   get_analytics_daily  — created_at::date → KST date
--   get_analytics_monthly — DATE_TRUNC(month, created_at) → KST month
-- 併せて: analytics 테이블에 session_id 컬럼 추가 (Task 2용)
-- =============================================================

-- ── 1. get_analytics_daily ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_analytics_daily(days_count integer)
RETURNS TABLE(day text, visits bigint, quiz_completes bigint, scent_completes bigint)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  WITH date_series AS (
    SELECT generate_series(
      ((NOW() AT TIME ZONE 'Asia/Seoul') - ((days_count - 1) || ' days')::interval)::date,
      (NOW() AT TIME ZONE 'Asia/Seoul')::date,
      '1 day'::interval
    )::date AS d
  ),
  analytics_agg AS (
    SELECT
      (created_at AT TIME ZONE 'Asia/Seoul')::date AS d,
      SUM(CASE WHEN event_type = 'page_visit'    THEN 1 ELSE 0 END) AS visits,
      SUM(CASE WHEN event_type = 'quiz_complete' THEN 1 ELSE 0 END) AS quiz_completes
    FROM analytics
    WHERE (created_at AT TIME ZONE 'Asia/Seoul')::date >=
          ((NOW() AT TIME ZONE 'Asia/Seoul') - ((days_count - 1) || ' days')::interval)::date
    GROUP BY (created_at AT TIME ZONE 'Asia/Seoul')::date
  ),
  scent_agg AS (
    SELECT
      (created_at AT TIME ZONE 'Asia/Seoul')::date AS d,
      COUNT(*) AS scent_completes
    FROM scent_results
    WHERE (created_at AT TIME ZONE 'Asia/Seoul')::date >=
          ((NOW() AT TIME ZONE 'Asia/Seoul') - ((days_count - 1) || ' days')::interval)::date
    GROUP BY (created_at AT TIME ZONE 'Asia/Seoul')::date
  )
  SELECT
    TO_CHAR(ds.d, 'FMMM/FMDD')     AS day,
    COALESCE(aa.visits, 0)          AS visits,
    COALESCE(aa.quiz_completes, 0)  AS quiz_completes,
    COALESCE(sa.scent_completes, 0) AS scent_completes
  FROM date_series ds
  LEFT JOIN analytics_agg aa ON aa.d = ds.d
  LEFT JOIN scent_agg sa     ON sa.d = ds.d
  ORDER BY ds.d;
$$;

-- ── 2. get_analytics_monthly ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_analytics_monthly(months_count integer DEFAULT NULL)
RETURNS TABLE(month text, visits bigint, quiz_completes bigint, scent_completes bigint)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  WITH month_series AS (
    SELECT generate_series(
      CASE
        WHEN months_count IS NULL
          THEN DATE_TRUNC('month', (SELECT MIN(created_at AT TIME ZONE 'Asia/Seoul') FROM analytics))
        ELSE DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Seoul')
               - ((months_count - 1) || ' months')::interval
      END,
      DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Seoul'),
      '1 month'::interval
    )::date AS m
  ),
  analytics_agg AS (
    SELECT
      DATE_TRUNC('month', created_at AT TIME ZONE 'Asia/Seoul')::date AS m,
      SUM(CASE WHEN event_type = 'page_visit'    THEN 1 ELSE 0 END) AS visits,
      SUM(CASE WHEN event_type = 'quiz_complete' THEN 1 ELSE 0 END) AS quiz_completes
    FROM analytics
    WHERE months_count IS NULL
       OR created_at AT TIME ZONE 'Asia/Seoul' >=
          DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Seoul')
            - ((months_count - 1) || ' months')::interval
    GROUP BY DATE_TRUNC('month', created_at AT TIME ZONE 'Asia/Seoul')::date
  ),
  scent_agg AS (
    SELECT
      DATE_TRUNC('month', created_at AT TIME ZONE 'Asia/Seoul')::date AS m,
      COUNT(*) AS scent_completes
    FROM scent_results
    WHERE months_count IS NULL
       OR created_at AT TIME ZONE 'Asia/Seoul' >=
          DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Seoul')
            - ((months_count - 1) || ' months')::interval
    GROUP BY DATE_TRUNC('month', created_at AT TIME ZONE 'Asia/Seoul')::date
  )
  SELECT
    TO_CHAR(ms.m, 'YY/MM')          AS month,
    COALESCE(aa.visits, 0)           AS visits,
    COALESCE(aa.quiz_completes, 0)   AS quiz_completes,
    COALESCE(sa.scent_completes, 0)  AS scent_completes
  FROM month_series ms
  LEFT JOIN analytics_agg aa ON aa.m = ms.m
  LEFT JOIN scent_agg sa     ON sa.m = ms.m
  ORDER BY ms.m;
$$;

-- ── 3. analytics.session_id 컬럼 추가 (Task 2: quiz_complete 중복 방지용) ──
ALTER TABLE public.analytics
  ADD COLUMN IF NOT EXISTS session_id text;
