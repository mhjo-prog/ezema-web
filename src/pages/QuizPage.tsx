import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import SurveyPage from "./SurveyPage";
import LoadingPage from "./LoadingPage";
import ResultPage from "./ResultPage";
import { useAuth } from "../context/AuthContext";
import { supabase, isSupabaseReady } from "../lib/supabase";

type QuizScreen = "survey" | "loading" | "result";

const VALID_TYPES = ["태양인", "소양인", "태음인", "소음인"];

function determineType(scores: Record<string, number>): string {
  return Object.entries(scores).reduce(
    (best, [type, score]) => (score > best.score ? { type, score } : best),
    { type: "태음인", score: -1 }
  ).type;
}

const SESSION_KEY = "ezema_quiz_result";

export default function QuizPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [screen, setScreen] = useState<QuizScreen>("survey");
  const [surveyKey, setSurveyKey] = useState(0);
  const [constitutionType, setConstitutionType] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isShared, setIsShared] = useState(false);
  const [isHistory, setIsHistory] = useState(false);

  useEffect(() => {
    // 1) URL 파라미터로 공유된 결과 (카카오 공유 등)
    const type = searchParams.get("type");
    if (type && VALID_TYPES.includes(type)) {
      setConstitutionType(type);
      const urlScores: Record<string, number> = {};
      VALID_TYPES.forEach((t) => {
        const val = searchParams.get(t);
        if (val !== null) urlScores[t] = Number(val);
      });
      if (Object.keys(urlScores).length > 0) setScores(urlScores);
      if (searchParams.get("from") === "history") {
        setIsHistory(true);
      } else {
        setIsShared(true);
      }
      setScreen("result");
      return;
    }

    // 2) 새로고침 시 sessionStorage에 저장된 결과 복원
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const { constitutionType: savedType, scores: savedScores } = JSON.parse(saved);
        if (savedType && VALID_TYPES.includes(savedType)) {
          setConstitutionType(savedType);
          setScores(savedScores ?? {});
          setScreen("result");
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const handleSurveyComplete = useCallback((s: Record<string, number>) => {
    const type = determineType(s);
    setScores(s);
    setConstitutionType(type);
    const result = JSON.stringify({ constitutionType: type, scores: s });
    sessionStorage.setItem(SESSION_KEY, result);
    localStorage.setItem("ezema_mypage_result", result);

    // 로그인 유저면 DB에도 저장
    if (user && isSupabaseReady) {
      supabase.from("quiz_results").insert({
        kakao_id: user.kakao_id,
        constitution_type: type,
        scores: s,
      }).then(({ error }) => {
        if (error) console.error("[quiz_results] insert error:", error);
      });
    }

    setScreen("loading");
  }, [user]);

  const handleLoadingComplete = useCallback(() => {
    setScreen("result");
  }, []);

  return (
    <AnimatePresence mode="wait">
      {screen === "survey" && (
        <SurveyPage
          key={`survey-${surveyKey}`}
          onComplete={handleSurveyComplete}
          onBack={() => navigate("/")}
        />
      )}
      {screen === "loading" && (
        <LoadingPage
          key="loading"
          onComplete={handleLoadingComplete}
        />
      )}
      {screen === "result" && (
        <ResultPage
          key="result"
          constitutionType={constitutionType}
          scores={scores}
          onRetry={() => {
            sessionStorage.removeItem(SESSION_KEY);
            setConstitutionType("");
            setScores({});
            setIsShared(false);
            setIsHistory(false);
            setSurveyKey((k) => k + 1);
            setScreen("survey");
          }}
          isShared={isShared}
          isHistory={isHistory}
        />
      )}
    </AnimatePresence>
  );
}
