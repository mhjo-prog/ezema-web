/**
 * 런타임 환경 판별 유틸
 *
 * SSR(prerender) 환경에서는 window가 없으므로 typeof window 체크 후 접근.
 * window가 없는 환경(Node.js SSR)은 프로덕션으로 간주.
 */
export const isProductionEnv =
  typeof window === "undefined" ||
  (window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1");
