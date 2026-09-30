# Analytics KST 기준 통일 + quiz_complete 중복 방지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 차트 날짜 집계를 UTC→KST로 통일하고, quiz_complete Supabase 이벤트의 새로고침 중복 기록을 제거하며 session_id로 추적 가능하게 한다.

**Architecture:**
- Task 1: DB RPC 함수 2개를 KST 기준으로 교체하는 Supabase 마이그레이션
- Task 2: analytics 테이블에 session_id 컬럼 추가 + ResultPage 중복 삽입 제거 + QuizPage 완료 시점으로 이동

**Tech Stack:** PostgreSQL (Supabase), React/TypeScript (Vite)

**Spec:** 이 문서 상단의 분석 결과 및 사용자 요구사항

## Global Constraints

- DB 함수 교체는 CREATE OR REPLACE (기존 함수 drop 불가)
- analytics 테이블 컬럼 추가는 ADD COLUMN IF NOT EXISTS
- 코드 수정은 AdminPage.tsx, QuizPage.tsx, ResultPage.tsx 3개 파일만
- isProductionEnv / isSupabaseReady 가드 유지
- 새로고침(sessionStorage 복원) 시 quiz_complete 이벤트 이중 발화 금지

## Review Focus

- 새로고침 → sessionStorage 복원 → ResultPage 마운트 시 quiz_complete 재발화 여부
- 공유 링크(isShared=true) 진입 시 quiz_complete 발화 안 되는지
- days_count=1 일 때 KST 오늘 날짜만 반환하는지 (off-by-one)
- analytics.session_id가 null 허용인지 확인 (기존 레코드 영향 없어야 함)

---

## Task 1: get_analytics_daily / get_analytics_monthly KST 기준으로 교체

**Files:**
- Create: `supabase/migrations/20260930_005_kst_analytics.sql`

**변경 핵심:**
- `created_at::date` → `(created_at AT TIME ZONE 'Asia/Seoul')::date`
- `NOW()::date` → `(NOW() AT TIME ZONE 'Asia/Seoul')::date`
- `DATE_TRUNC('month', created_at)` → `DATE_TRUNC('month', created_at AT TIME ZONE 'Asia/Seoul')`
- `DATE_TRUNC('month', NOW())` → `DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Seoul')`
- WHERE 절의 날짜 하한도 동일하게 KST 기준으로

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- supabase/migrations/20260930_005_kst_analytics.sql
-- get_analytics_daily + get_analytics_monthly KST(Asia/Seoul) 기준으로 교체

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
```

- [ ] **Step 2: Supabase에 마이그레이션 적용** (`apply_migration` MCP 사용)

- [ ] **Step 3: 검증 쿼리 — 9/29 KST 기준 7건으로 나오는지 확인**

```sql
SELECT * FROM get_analytics_daily(7);
-- 9/29 행의 quiz_completes = 7 이어야 함 (UTC기준 8→KST기준 7)
```

---

## Task 2: quiz_complete 중복 방지 + session_id 추가

**Files:**
- Create: `supabase/migrations/20260930_005_kst_analytics.sql` (Task 1과 동일 파일에 합산)
- Modify: `src/pages/QuizPage.tsx` (analytics insert 추가)
- Modify: `src/pages/ResultPage.tsx` (analytics insert 제거)

**중복 발생 구조 (현재):**
```
QuizPage: sessionStorage에 결과 저장
  ↓
ResultPage 마운트 → useEffect([]) → analytics.insert(quiz_complete)  ← 문제 지점

새로고침 시:
QuizPage useEffect → sessionStorage 복원 → screen="result"
  ↓
ResultPage 다시 마운트 → useEffect([]) → analytics.insert(quiz_complete)  ← 중복!
```

**수정 방향:**
- ResultPage의 analytics insert를 제거
- QuizPage의 `handleSurveyComplete`에서 analytics insert (= 완료 직후 1회만 실행되는 지점)
- `session_id = crypto.randomUUID()`를 생성해서 analytics에 함께 저장
- sessionStorage에 이미 결과가 있으면 (복원 경로) insert 안 함

- [ ] **Step 1: analytics 테이블에 session_id 컬럼 추가** (마이그레이션 파일에 추가)

```sql
ALTER TABLE public.analytics
  ADD COLUMN IF NOT EXISTS session_id text;
```

- [ ] **Step 2: `ResultPage.tsx` — analytics insert useEffect 제거**

제거 대상 (`ResultPage.tsx` 1406~1412번 줄):
```tsx
// 삭제
useEffect(() => {
  if (isSupabaseReady && isProductionEnv && constitutionType && !isShared && !isHistory) {
    supabase.from("analytics").insert({ event_type: "quiz_complete", constitution_type: constitutionType })
      .then(({ error }) => { if (error) console.log("[analytics] insert error:", error); });
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

import에서 `supabase`, `isSupabaseReady`, `isProductionEnv`가 ResultPage에서만 쓰이던 것이면 import도 정리.

- [ ] **Step 3: `QuizPage.tsx` — handleSurveyComplete에 analytics insert 추가**

```tsx
const handleSurveyComplete = useCallback((s: Record<string, number>) => {
  const type = determineType(s);
  trackQuizComplete("sasang", type);
  setScores(s);
  setConstitutionType(type);
  const sessionId = crypto.randomUUID();                          // ← 추가
  const result = JSON.stringify({ constitutionType: type, scores: s });
  sessionStorage.setItem(SESSION_KEY, result);
  localStorage.setItem("ezema_mypage_result", result);

  // analytics insert — 완료 시점에서 1회만 실행되므로 중복 없음
  if (isSupabaseReady && isProductionEnv) {                       // ← 추가 블록
    supabase.from("analytics").insert({
      event_type: "quiz_complete",
      constitution_type: type,
      session_id: sessionId,
    }).then(({ error }) => {
      if (error) console.error("[analytics] quiz_complete insert 실패:", error);
    });
  }
  // ...기존 quiz_results insert 유지...
}, [user]);
```

- [ ] **Step 4: Supabase 마이그레이션 적용** (session_id 컬럼)

- [ ] **Step 5: 검증**

```sql
-- 최신 quiz_complete 행에 session_id가 채워지는지 확인
SELECT id, event_type, session_id, created_at
FROM public.analytics
WHERE event_type = 'quiz_complete'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Task 3: 커밋 → push → Vercel 배포 + GitHub 웹훅 복구

**Vercel 자동 배포 단절 원인:** GitHub 레포에 Vercel 웹훅이 **없음** (`gh api repos/mhjo-prog/ezema-web/hooks` = `[]`)

Vercel project ID와 GitHub repo는 연결돼 있지만 (`vercel git connect` = already connected), 실제 push 트리거 웹훅이 없어 자동 배포가 안 됨.

**복구 방법:** `vercel git disconnect` → `vercel git connect` 재연결로 웹훅 재등록

- [ ] **Step 1: 변경 파일 커밋**
```bash
git add supabase/migrations/20260930_005_kst_analytics.sql \
        src/pages/QuizPage.tsx src/pages/ResultPage.tsx
git commit -m "fix: analytics KST 기준 통일 + quiz_complete 중복 방지"
```

- [ ] **Step 2: GitHub push**
```bash
git push origin main
```

- [ ] **Step 3: Vercel 웹훅 재등록**
```bash
cd /path/to/ezema-web
vercel git disconnect
vercel git connect
```

- [ ] **Step 4: Vercel production 배포**
```bash
vercel --prod
```

- [ ] **Step 5: 웹훅 등록 확인**
```bash
gh api repos/mhjo-prog/ezema-web/hooks
# vercel.com URL을 포함한 hook이 1개 이상 나와야 함
```
