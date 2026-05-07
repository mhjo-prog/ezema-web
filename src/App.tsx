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

export default function App() {
  const navigate = useNavigate();
  const quizStarted = useRef(false);

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

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
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
