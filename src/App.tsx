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

function AppRoutes({ onQuizStart }: { onQuizStart: () => void }) {
  const location = useLocation();
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
      </Routes>
    </AnimatePresence>
  );
}

export const PENDING_LANG_KEY = "keepslow_pending_lang";

export default function App() {
  const navigate = useNavigate();
  const quizStarted = useRef(false);

  // 비한국어→비한국어 전환 2단계: 한국어로 리셋된 뒤 대기 중인 언어를 적용
  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_LANG_KEY);
    if (!pending) return;
    sessionStorage.removeItem(PENDING_LANG_KEY);
    document.cookie = `googtrans=/ko/${pending}; path=/`;
    document.cookie = `googtrans=/ko/${pending}; path=/; domain=.${window.location.hostname}`;
    window.location.reload();
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
