/**
 * 런타임 환경 판별 유틸
 *
 * import.meta.env.PROD는 Vite 빌드 타임에 치환되는 변수로,
 * 배포 캐시나 빌드 파이프라인에 따라 신뢰성이 낮을 수 있다.
 * 프로젝트 전반에서 이미 kakaoApi.ts가 hostname 기반 분기를 사용하는 패턴을 따른다.
 */
export const isProductionEnv =
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1";
