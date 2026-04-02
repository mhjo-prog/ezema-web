import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import SurveyPage from "./SurveyPage";
import LoadingPage from "./LoadingPage";
import ResultPage from "./ResultPage";

type QuizScreen = "survey" | "loading" | "result";

const VALID_TYPES = ["태양인", "소양인", "태음인", "소음인"];

function determineType(scores: Record<string, number>): string {
  return Object.entries(scores).reduce(
    (best, [type, score]) => (score > best.score ? { type, score } : best),
    { type: "태음인", score: -1 }
  ).type;
}

export default function QuizPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [screen, setScreen] = useState<QuizScreen>("survey");
  const [constitutionType, setConstitutionType] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type && VALID_TYPES.includes(type)) {
      setConstitutionType(type);
      const urlScores: Record<string, number> = {};
      VALID_TYPES.forEach((t) => {
        const val = searchParams.get(t);
        if (val !== null) urlScores[t] = Number(val);
      });
      if (Object.keys(urlScores).length > 0) setScores(urlScores);
      setIsShared(true);
      setScreen("result");
    }
  }, []);

  const handleSurveyComplete = (s: Record<string, number>) => {
    setScores(s);
    setConstitutionType(determineType(s));
    setScreen("loading");
  };

  return (
    <AnimatePresence mode="wait">
      {screen === "survey" && (
        <SurveyPage
          key="survey"
          onComplete={handleSurveyComplete}
          onBack={() => navigate("/")}
        />
      )}
      {screen === "loading" && (
        <LoadingPage
          key="loading"
          onComplete={() => setScreen("result")}
        />
      )}
      {screen === "result" && (
        <ResultPage
          key="result"
          constitutionType={constitutionType}
          scores={scores}
          onRetry={() => {
            setConstitutionType("");
            setScores({});
            setIsShared(false);
            setScreen("survey");
          }}
          isShared={isShared}
        />
      )}
    </AnimatePresence>
  );
}
