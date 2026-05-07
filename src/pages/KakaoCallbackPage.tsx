import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KAKAO_REST_KEY, REDIRECT_URI, upsertKakaoUser, type KakaoUser } from "../lib/kakaoApi";
import { useAuth, KAKAO_BROADCAST_CHANNEL } from "../context/AuthContext";

type Status = "processing" | "error";

export default function KakaoCallbackPage() {
  const navigate = useNavigate();
  const { setUserFromCallback } = useAuth();
  const [status, setStatus] = useState<Status>("processing");
  const [errorMsg, setErrorMsg] = useState("");
  const hasProcessed = useRef(false);

  useEffect(() => {
    // React StrictMode에서 effect가 두 번 실행되는 것 방지
    // (카카오 auth code는 1회용이므로 두 번째 요청 시 KOE320 에러 발생)
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error || !code) {
      handleError("카카오 로그인이 취소되었습니다.");
      return;
    }

    processLogin(code);
  }, []);

  const broadcast = (message: object) => {
    // BroadcastChannel: window.opener가 COOP 헤더로 null인 경우에도 동작
    try {
      const channel = new BroadcastChannel(KAKAO_BROADCAST_CHANNEL);
      channel.postMessage(message);
      // 메시지 전달 보장 후 닫기
      setTimeout(() => channel.close(), 300);
    } catch {
      // BroadcastChannel 미지원 브라우저 fallback
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(message, window.location.origin);
        } catch {}
      }
    }
  };

  const handleError = (msg: string) => {
    setStatus("error");
    setErrorMsg(msg);

    if (window.opener && !window.opener.closed) {
      broadcast({ type: "KAKAO_LOGIN_ERROR", message: msg });
      setTimeout(() => window.close(), 1200);
    } else {
      broadcast({ type: "KAKAO_LOGIN_ERROR", message: msg });
      setTimeout(() => navigate("/", { replace: true }), 2000);
    }
  };

  const processLogin = async (code: string) => {
    try {
      // 1. Authorization code → Access Token
      const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: KAKAO_REST_KEY,
          redirect_uri: REDIRECT_URI,
          code,
          ...(import.meta.env.VITE_KAKAO_CLIENT_SECRET
            ? { client_secret: import.meta.env.VITE_KAKAO_CLIENT_SECRET }
            : {}),
        }),
      });

      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({}));
        throw new Error((errData as any).error_description || "토큰 발급에 실패했습니다.");
      }

      const tokenData = await tokenRes.json();
      const accessToken: string = tokenData.access_token;

      // 2. Access Token → 유저 정보
      const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      });

      if (!userRes.ok) throw new Error("사용자 정보를 가져올 수 없습니다.");

      const userData = await userRes.json();

      const user: KakaoUser = {
        kakao_id: String(userData.id),
        nickname:
          userData.kakao_account?.profile?.nickname ||
          userData.properties?.nickname ||
          "카카오 사용자",
        email: userData.kakao_account?.email || undefined,
        profile_image:
          userData.kakao_account?.profile?.profile_image_url ||
          userData.properties?.profile_image ||
          undefined,
      };

      // 3. Supabase에 유저 저장 (upsert)
      await upsertKakaoUser(user);

      // 4. 팝업으로 열린 경우: BroadcastChannel로 부모에 전송 후 팝업 닫기
      //    직접 접근한 경우: 상태 저장 후 메인으로 리다이렉트
      if (window.opener !== null || window.name === "kakaoLogin") {
        broadcast({ type: "KAKAO_LOGIN_SUCCESS", user });
        // 메시지 전달 보장 후 팝업 닫기
        setTimeout(() => window.close(), 300);
      } else {
        setUserFromCallback(user);
        navigate("/", { replace: true });
      }
    } catch (err) {
      handleError(
        err instanceof Error ? err.message : "로그인 처리 중 오류가 발생했습니다."
      );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "20px",
        background: "#fafafa",
        fontFamily: "Pretendard, sans-serif",
      }}
    >
      {status === "processing" ? (
        <>
          <div
            style={{
              width: "44px",
              height: "44px",
              border: "3px solid #f0f0f0",
              borderTop: "3px solid #FEE500",
              borderRadius: "50%",
              animation: "ks-spin 0.75s linear infinite",
            }}
          />
          <p style={{ color: "#555", fontSize: "0.9rem", margin: 0 }}>
            카카오 로그인 처리 중...
          </p>
        </>
      ) : (
        <>
          <p style={{ color: "#e53e3e", fontSize: "0.95rem", margin: 0 }}>{errorMsg}</p>
          <p style={{ color: "#aaa", fontSize: "0.82rem", margin: 0 }}>
            잠시 후 자동으로 이동합니다
          </p>
        </>
      )}
      <style>{`@keyframes ks-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
