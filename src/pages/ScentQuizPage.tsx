import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ScentSurveyPage from "./ScentSurveyPage";
import ScentLoadingPage from "./ScentLoadingPage";
import ScentResultPage from "./ScentResultPage";
import type { ScentType } from "../data/scentQuestions";

type QuizScreen = "survey" | "loading" | "result";

const VALID_TYPES: ScentType[] = ["이완", "숙면", "활력", "몰입", "청정"];
const SESSION_KEY = "ezema_scent_quiz_result";

const AXIS_ORDER: ScentType[] = ["이완", "숙면", "활력", "몰입", "청정"];
const FACET_ORDER = [
  "onset","maintain","morning","rhythm",
  "emotional","physical","autonomic","recovery",
  "afternoon","wakeup","fatigue","caffeine",
  "duration","distract","switch","screen",
  "airway","sensitive","stuffy","hygiene",
];

function determineType(scores: Record<string, number>): ScentType {
  let bestType: ScentType = "이완";
  let bestScore = Infinity;
  for (const [type, score] of Object.entries(scores)) {
    if (score < bestScore) {
      bestScore = score;
      bestType = type as ScentType;
    }
  }
  return bestType;
}

function parseSharedParams(): { scentType: ScentType; scores: Record<string, number>; facetScores: Record<string, number> } | null {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("scentType") as ScentType | null;
  const asStr = params.get("as");
  const fsStr = params.get("fs");
  if (!type || !VALID_TYPES.includes(type) || !asStr || !fsStr) return null;

  const axisVals = asStr.split(",").map(Number);
  const facetVals = fsStr.split(",").map(Number);
  if (axisVals.length !== AXIS_ORDER.length || facetVals.length !== FACET_ORDER.length) return null;

  const scores: Record<string, number> = {};
  AXIS_ORDER.forEach((t, i) => { scores[t] = axisVals[i]; });

  const facetScores: Record<string, number> = {};
  FACET_ORDER.forEach((f, i) => { facetScores[f] = facetVals[i]; });

  return { scentType: type, scores, facetScores };
}

export default function ScentQuizPage() {
  const navigate = useNavigate();

  const [screen, setScreen] = useState<QuizScreen>("survey");
  const [surveyKey, setSurveyKey] = useState(0);
  const [scentType, setScentType] = useState<ScentType>("이완");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [facetScores, setFacetScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const shared = parseSharedParams();
    if (shared) {
      setScentType(shared.scentType);
      setScores(shared.scores);
      setFacetScores(shared.facetScores);
      setScreen("result");
    }
  }, []);

  const handleSurveyComplete = useCallback((axisScores: Record<string, number>, rawFacetScores: Record<string, number>) => {
    const type = determineType(axisScores);
    if (!VALID_TYPES.includes(type)) return;
    setScores(axisScores);
    setFacetScores(rawFacetScores);
    setScentType(type);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ scentType: type, scores: axisScores, facetScores: rawFacetScores }));
    setScreen("loading");
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setScreen("result");
  }, []);

  const handleRetry = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setScentType("이완");
    setScores({});
    setFacetScores({});
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
      {screen === "result" && (
        <ScentResultPage
          key="scent-result"
          scentType={scentType}
          scores={scores}
          facetScores={facetScores}
          onRetry={handleRetry}
        />
      )}
    </AnimatePresence>
  );
}
