import { createContext, useContext, useEffect, useRef, useState } from "react";
import { KAKAO_JS_KEY, KAKAO_REST_KEY, REDIRECT_URI, type KakaoUser } from "../lib/kakaoApi";

export type { KakaoUser };

interface AuthContextType {
  user: KakaoUser | null;
  isLoading: boolean;
  loginWithKakao: () => void;
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

  const loginWithKakao = () => {
    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2.5;

    const kakaoAuthUrl =
      `https://kauth.kakao.com/oauth/authorize` +
      `?client_id=${KAKAO_REST_KEY}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code`;

    const popup = window.open(
      kakaoAuthUrl,
      "kakaoLogin",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=no`
    );

    if (!popup) {
      // 팝업 차단 시 현재 페이지에서 리다이렉트
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
        setUser(userData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        cleanup();
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
    setUser(userData);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
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
