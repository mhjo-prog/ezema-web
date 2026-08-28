import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ScentSurveyPage from "./ScentSurveyPage";
import type { PartBAnswers } from "./ScentSurveyPage";
import ScentLoadingPage from "./ScentLoadingPage";
import ScentResultPage from "./ScentResultPage";
import { recommend } from "../lib/recommend";
import type { RecommendOutput } from "../lib/recommend";

type QuizScreen = "survey" | "loading" | "result";

const SESSION_KEY = "ezema_scent_quiz_result_v2";

export default function ScentQuizPage() {
  const navigate = useNavigate();

  const [screen, setScreen] = useState<QuizScreen>("survey");
  const [surveyKey, setSurveyKey] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [recommendOutput, setRecommendOutput] = useState<RecommendOutput | null>(null);

  const handleSurveyComplete = useCallback(
    (itemScores: Record<string, number>, partB: PartBAnswers) => {
      const output = recommend({
        itemScores,
        surveyCount: 0,
        preferences: partB.preferences.length > 0 ? partB.preferences : undefined,
        avoided: partB.avoided.length > 0 ? partB.avoided : undefined,
        space: partB.space ?? undefined,
        safetyFlags: partB.safetyFlags.length > 0 ? partB.safetyFlags : undefined,
        startedAt,
        submittedAt: Date.now(),
      });
      setRecommendOutput(output);
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(output));
      } catch {
        // sessionStorage unavailable — continue without caching
      }
      setScreen("loading");
    },
    [startedAt]
  );

  const handleLoadingComplete = useCallback(() => {
    setScreen("result");
  }, []);

  const handleRetry = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setRecommendOutput(null);
    setSurveyKey((k) => k + 1);
    setScreen("survey");
  };

  return (
    <AnimatePresence mode="wait">
      {screen === "survey" && (
        <ScentSurveyPage
          key={`scent-survey-${surveyKey}`}
          onComplete={handleSurveyComplete}
          onBack={() => navigate("/test")}
        />
      )}
      {screen === "loading" && (
        <ScentLoadingPage
          key="scent-loading"
          onComplete={handleLoadingComplete}
        />
      )}
      {screen === "result" && recommendOutput && (
        <ScentResultPage
          key="scent-result"
          recommendOutput={recommendOutput}
          onRetry={handleRetry}
        />
      )}
    </AnimatePresence>
  );
}
