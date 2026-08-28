import { createContext, useContext, useEffect, useRef, useState } from "react";
import { KAKAO_JS_KEY, KAKAO_REST_KEY, REDIRECT_URI, type KakaoUser } from "../lib/kakaoApi";
import { migrateLocalBookmarksToDb } from "../lib/bookmarks";
import { supabase, isSupabaseReady } from "../lib/supabase";

import { isProductionEnv } from "../lib/env";

export const PENDING_RESULT_KEY = "pending_result";
export const PENDING_SCENT_KEY = "pending_scent_result";

async function savePendingScentResult(kakaoId: string) {
  try {
    const raw = localStorage.getItem(PENDING_SCENT_KEY);
    if (!raw) return;
    const { scentType, scores, facetScores } = JSON.parse(raw);
    localStorage.removeItem(PENDING_SCENT_KEY);
    if (isSupabaseReady && scentType && isProductionEnv) {
      const { error } = await supabase
        .from("scent_results")
        .insert({ kakao_id: kakaoId, scent_type: scentType, scores, facet_scores: facetScores });
      if (error) console.error("[savePendingScentResult] insert 오류:", error);
    }
  } catch (e) {
    console.error("[savePendingScentResult] 오류:", e);
  }
}

async function savePendingResult(kakaoId: string) {
  console.log("[savePendingResult] 호출됨 — kakao_id:", kakaoId);
  try {
    const raw = localStorage.getItem(PENDING_RESULT_KEY);
    console.log("[savePendingResult] localStorage raw:", raw);
    if (!raw) {
      console.log("[savePendingResult] pending_result 없음 — 저장 건너뜀");
      return;
    }
    const { constitutionType, scores } = JSON.parse(raw);
    console.log("[savePendingResult] 파싱 결과 — constitutionType:", constitutionType, "scores:", scores);
    localStorage.removeItem(PENDING_RESULT_KEY);
    console.log("[savePendingResult] localStorage 삭제 완료. isSupabaseReady:", isSupabaseReady);
    if (isSupabaseReady && constitutionType && isProductionEnv) {
      console.log("[savePendingResult] supabase insert 시작 — payload:", { kakao_id: kakaoId, constitution_type: constitutionType, scores });
      const { data, error } = await supabase
        .from("quiz_results")
        .insert({ kakao_id: kakaoId, constitution_type: constitutionType, scores })
        .select();
      console.log("[savePendingResult] insert 결과 — data:", data, "error:", error);
    } else {
      console.warn("[savePendingResult] upsert 건너뜀 — isSupabaseReady:", isSupabaseReady, "constitutionType:", constitutionType);
    }
    console.log("[savePendingResult] /mypage 로 이동");
    window.location.href = "/mypage";
  } catch (e) {
    console.error("[savePendingResult] 오류:", e);
  }
}

export type { KakaoUser };

interface AuthContextType {
  user: KakaoUser | null;
  isLoading: boolean;
  loginWithKakao: (redirectTo?: string) => void;
  logout: () => void;
  setUserFromCallback: (user: KakaoUser) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  loginWithKakao: () => {},
  logout: () => {},
  setUserFromCallback: () => {},
});

const USER_STORAGE_KEY = "keepslow_kakao_user";
export const KAKAO_BROADCAST_CHANNEL = "keepslow_kakao_auth";

// 팝업 방식인지 리다이렉트 방식인지를 window.opener/window.name 추측 대신
// 명시적으로 저장해서 콜백 페이지가 정확히 분기하도록 함
export const KAKAO_LOGIN_MODE_KEY = "keepslow_kakao_login_mode";
// 리다이렉트(모바일) 로그인 완료 후 이동할 경로
export const POST_LOGIN_REDIRECT_KEY = "keepslow_post_login_redirect";

function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini|KAKAOTALK|NAVER/i.test(
    navigator.userAgent
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<KakaoUser | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const kakao = (window as any).Kakao;
    if (kakao && !kakao.isInitialized()) {
      kakao.init(KAKAO_JS_KEY);
    }
  }, []);

  const cleanup = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    channelRef.current?.close();
    channelRef.current = null;
    setIsLoading(false);
  };

  const loginWithKakao = (redirectTo?: string) => {
    const kakaoAuthUrl =
      `https://kauth.kakao.com/oauth/authorize` +
      `?client_id=${KAKAO_REST_KEY}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=account_email`; // 선택 동의 — 미동의 시에도 로그인은 정상 처리됨

    if (redirectTo) {
      sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, redirectTo);
    }

    // 모바일(카카오톡 인앱 브라우저 등)은 window.open이 팝업이 아니라
    // 같은 탭/새 탭으로 열리는 경우가 많아 opener/name 기반 판별이 깨짐.
    // 모바일에서는 처음부터 팝업을 시도하지 않고 같은 탭 리다이렉트로 처리.
    if (isMobileBrowser()) {
      sessionStorage.setItem(KAKAO_LOGIN_MODE_KEY, "redirect");
      window.location.href = kakaoAuthUrl;
      return;
    }

    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2.5;

    sessionStorage.setItem(KAKAO_LOGIN_MODE_KEY, "popup");
    const popup = window.open(
      kakaoAuthUrl,
      "kakaoLogin",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=no`
    );

    if (!popup) {
      // 팝업 차단 시 현재 페이지에서 리다이렉트
      sessionStorage.setItem(KAKAO_LOGIN_MODE_KEY, "redirect");
      window.location.href = kakaoAuthUrl;
      return;
    }

    popupRef.current = popup;
    setIsLoading(true);

    // BroadcastChannel로 수신 (window.opener가 COOP 헤더로 null이 되는 문제 우회)
    const channel = new BroadcastChannel(KAKAO_BROADCAST_CHANNEL);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent) => {
      if (event.data?.type === "KAKAO_LOGIN_SUCCESS") {
        const userData: KakaoUser = event.data.user;
        console.log("[AuthContext] KAKAO_LOGIN_SUCCESS — kakao_id:", userData.kakao_id);
        setUser(userData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        migrateLocalBookmarksToDb(userData.kakao_id);
        cleanup();
        savePendingResult(userData.kakao_id);
        savePendingScentResult(userData.kakao_id);
      } else if (event.data?.type === "KAKAO_LOGIN_ERROR") {
        cleanup();
      }
    };

    // 팝업 수동 닫기 감지
    pollTimerRef.current = setInterval(() => {
      if (popupRef.current?.closed) {
        cleanup();
      }
    }, 500);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    const kakao = (window as any).Kakao;
    if (kakao?.Auth?.getAccessToken()) {
      kakao.Auth.logout();
    }
  };

  const setUserFromCallback = (userData: KakaoUser) => {
    console.log("[AuthContext] setUserFromCallback — kakao_id:", userData.kakao_id);
    setUser(userData);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    migrateLocalBookmarksToDb(userData.kakao_id);
    savePendingResult(userData.kakao_id);
    savePendingScentResult(userData.kakao_id);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithKakao, logout, setUserFromCallback }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
