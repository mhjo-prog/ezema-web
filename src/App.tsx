import { useRef, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
import { AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import Header from "./components/Header";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import QuizPage from "./pages/QuizPage";
import SasangPage from "./pages/SasangPage";
import SasangDetailPage from "./pages/SasangDetailPage";
import AdminPage from "./pages/AdminPage";
import WellnessPage from "./pages/WellnessPage";
import WellnessDetailPage from "./pages/WellnessDetailPage";
import KakaoCallbackPage from "./pages/KakaoCallbackPage";
import AboutPage from "./pages/AboutPage";
import MyPage from "./pages/MyPage";
import ResultRoute from "./pages/ResultRoute";
import ScentQuizPage from "./pages/ScentQuizPage";
import { trackPageview } from "./lib/analytics";

function AppRoutes({ onQuizStart }: { onQuizStart: () => void }) {
  const location = useLocation();

  useEffect(() => {
    trackPageview(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return (
    <AnimatePresence mode="wait">
      <ScrollToTop />
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/test" element={<LandingPage onStart={onQuizStart} />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/sasang" element={<SasangPage />} />
        <Route path="/sasang/:id" element={<SasangDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/wellness" element={<WellnessPage />} />
        <Route path="/wellness/:id" element={<WellnessDetailPage />} />
        <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/result" element={<ResultRoute />} />
        <Route path="/scent-quiz" element={<ScentQuizPage />} />
      </Routes>
    </AnimatePresence>
  );
}

export const PENDING_LANG_KEY = "keepslow_pending_lang";

// googtrans 언어 코드 → HTML lang 속성 매핑
const LANG_TO_HTML: Record<string, string> = {
  ko: "ko",
  en: "en",
  ja: "ja",
  "zh-CN": "zh-Hans",
  th: "th",
  vi: "vi",
};

export function applyHtmlLang(code: string) {
  document.documentElement.lang = LANG_TO_HTML[code] ?? code;
}

export default function App() {
  const navigate = useNavigate();
  const quizStarted = useRef(false);

  // 언어 초기화 — 앱 마운트 시 1회만 실행
  useEffect(() => {
    // 1) 비한국어 2단계 전환: PENDING_LANG_KEY가 있으면 googtrans 쿠키 적용 후 리로드
    const pending = sessionStorage.getItem(PENDING_LANG_KEY);
    if (pending) {
      sessionStorage.removeItem(PENDING_LANG_KEY);
      sessionStorage.setItem("keepslow_lang", pending); // 세션 언어 확정
      document.cookie = `googtrans=/ko/${pending}; path=/`;
      document.cookie = `googtrans=/ko/${pending}; path=/; domain=.${window.location.hostname}`;
      window.location.reload();
      return;
    }

    // 2) 새 세션(keepslow_lang 없음) → 기본값 한국어, 잔류 쿠키 제거
    if (!sessionStorage.getItem("keepslow_lang")) {
      if (document.cookie.includes("googtrans")) {
        // 키를 먼저 기록 → 쿠키 삭제 실패해도 리로드 후 이 분기에 재진입하지 않음
        sessionStorage.setItem("keepslow_lang", "ko");
        const expired = "expires=Thu, 01 Jan 1970 00:00:00 UTC";
        document.cookie = `googtrans=; ${expired}; path=/`;
        document.cookie = `googtrans=; ${expired}; path=/; domain=.${window.location.hostname}`;
        document.cookie = `googtrans=; ${expired}; path=/; domain=${window.location.hostname}`;
        window.location.reload();
        return;
      }
      sessionStorage.setItem("keepslow_lang", "ko");
    }

    // 리로드 없이 정착: 현재 언어로 <html lang> 설정
    applyHtmlLang(sessionStorage.getItem("keepslow_lang") ?? "ko");
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Google Translate가 DOM을 수정하면 body 높이가 바뀌므로 Lenis 스크롤 범위를 재계산
    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });
    resizeObserver.observe(document.body);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      resizeObserver.disconnect();
    };
  }, []);

  const handleQuizStart = () => {
    quizStarted.current = true;
    sessionStorage.removeItem("ezema_quiz_result");
    navigate("/quiz");
  };

  return (
    <div style={{ width: "100%" }}>
      <Header onQuizStart={handleQuizStart} />
      <AppRoutes onQuizStart={handleQuizStart} />
    </div>
  );
}
