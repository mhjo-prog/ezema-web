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
