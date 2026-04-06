import { useRef } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Header from "./components/Header";
import LandingPage from "./pages/LandingPage";
import QuizPage from "./pages/QuizPage";
import SasangPage from "./pages/SasangPage";
import SasangDetailPage from "./pages/SasangDetailPage";
import AdminPage from "./pages/AdminPage";
import WellnessPage from "./pages/WellnessPage";

function AppRoutes({ onQuizStart }: { onQuizStart: () => void }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage onStart={onQuizStart} />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/sasang" element={<SasangPage />} />
        <Route path="/sasang/:id" element={<SasangDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/wellness" element={<WellnessPage />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const navigate = useNavigate();
  const quizStarted = useRef(false);

  const handleQuizStart = () => {
    quizStarted.current = true;
    navigate("/quiz");
  };

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <Header onQuizStart={handleQuizStart} />
      <AppRoutes onQuizStart={handleQuizStart} />
    </div>
  );
}
