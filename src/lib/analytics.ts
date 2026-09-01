// Google Analytics 4 (gtag.js) 연동
// VITE_GA_MEASUREMENT_ID가 설정되지 않으면 아무 동작도 하지 않는다 (로컬 개발 환경 등).

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as
  | string
  | undefined;

let initialized = false;

/** 앱 시작 시 한 번 호출. gtag.js 스크립트를 삽입하고 dataLayer를 초기화한다. */
export function initGA() {
  if (!GA_MEASUREMENT_ID || initialized) return;
  initialized = true;

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  // 주의: gtag.js는 dataLayer에 push된 값이 `arguments` 객체일 때만 명령으로 인식한다.
  // 배열(rest 파라미터)로 push하면 에러 없이 조용히 무시되므로 반드시 arguments를 그대로 넘긴다.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  } as (...args: unknown[]) => void;

  window.gtag("js", new Date());
  // SPA이므로 초기 자동 page_view는 끄고, 라우트 변경 시 trackPageview로 직접 전송한다.
  window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
}

/** react-router 라우트 변경 시 호출해 page_view 이벤트를 전송한다. */
export function trackPageview(path: string) {
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/** 버튼 클릭, 퀴즈 완료 등 커스텀 이벤트 전송. */
export function trackEvent(action: string, params?: Record<string, unknown>) {
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== "function") return;
  window.gtag("event", action, params);
}

/* ---------------------------------------------------------------
 * 서비스 전용 이벤트 헬퍼
 * GA4에서 퍼널(시작 → 진행 → 완료 → 결과 → 저장/공유)을 보기 위한 래퍼.
 * quiz_type 파라미터로 사상체질(sasang) / 향 체질(scent)을 구분한다.
 * ------------------------------------------------------------- */

export type QuizType = "sasang" | "scent";

/** 진단 시작 (설문 첫 문항 진입 시 1회) */
export function trackQuizStart(quizType: QuizType) {
  trackEvent("quiz_start", { quiz_type: quizType });
}

const PROGRESS_MILESTONES = [25, 50, 75] as const;
const firedProgress = new Set<string>();

/**
 * 진단 진행률. 25/50/75% 지점을 각각 한 번씩만 전송해 중도 이탈 구간을 파악한다.
 * (문항마다 전송하면 이벤트가 과도하게 쌓이므로 마일스톤만 기록)
 */
export function trackQuizProgress(quizType: QuizType, answered: number, total: number) {
  if (total <= 0) return;
  const pct = (answered / total) * 100;
  for (const milestone of PROGRESS_MILESTONES) {
    const key = `${quizType}:${milestone}`;
    if (pct >= milestone && !firedProgress.has(key)) {
      firedProgress.add(key);
      trackEvent("quiz_progress", { quiz_type: quizType, progress: milestone });
    }
  }
}

/** 진단 완료 (마지막 문항 응답 직후) */
export function trackQuizComplete(quizType: QuizType, resultType: string) {
  trackEvent("quiz_complete", { quiz_type: quizType, result_type: resultType });
}

/** 결과 화면 노출. source로 직접 진단 / 공유 링크 / 기록 보기를 구분한다. */
export function trackResultView(
  quizType: QuizType,
  resultType: string,
  source: "own" | "shared" | "history"
) {
  trackEvent("result_view", { quiz_type: quizType, result_type: resultType, source });
}

/** 결과 저장 — open: 저장 모달 열림, success: 실제 저장 완료 */
export function trackResultSave(quizType: QuizType, stage: "open" | "success") {
  trackEvent("result_save", { quiz_type: quizType, stage });
}

/** 결과 공유 — open: 공유 모달 열림, kakao/copy: 실제 공유 실행 */
export function trackResultShare(quizType: QuizType, method: "open" | "kakao" | "copy") {
  trackEvent("result_share", { quiz_type: quizType, method });
}

/** 다시 검사하기 (진행률 마일스톤도 함께 초기화) */
export function trackQuizRetry(quizType: QuizType) {
  firedProgress.clear();
  trackEvent("quiz_retry", { quiz_type: quizType });
}

/** 카카오 로그인 완료 */
export function trackLogin(method: "kakao" = "kakao") {
  trackEvent("login", { method });
}
