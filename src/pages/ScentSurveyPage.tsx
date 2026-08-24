import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { scentQuestions } from "../data/scentQuestions";
import type { ScentType, Facet } from "../data/scentQuestions";

const ACCENT = "#4A0E14";
const ACCENT_LIGHT = "#7A2A32";

interface Props {
  onComplete: (axisScores: Record<string, number>, facetScores: Record<string, number>) => void;
  onBack: () => void;
}

export default function ScentSurveyPage({ onComplete, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const [totalScores, setTotalScores] = useState<Record<ScentType, number>>({
    이완: 0,
    숙면: 0,
    활력: 0,
    몰입: 0,
    청정: 0,
  });
  const [facetRawScores, setFacetRawScores] = useState<Record<string, number>>({});
  const [scoreHistory, setScoreHistory] = useState<Record<string, number>[]>([]);
  const [facetHistory, setFacetHistory] = useState<Record<string, number>[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentIndex]);

  const current = scentQuestions[currentIndex];
  const progressPct = ((currentIndex + 1) / scentQuestions.length) * 100;

  const handleSelect = (optionId: string) => {
    if (selectedId) return;
    setSelectedId(optionId);

    const option = current.options.find((o) => o.id === optionId)!;
    const newScores = { ...totalScores };
    Object.entries(option.scores).forEach(([k, v]) => {
      newScores[k as ScentType] = (newScores[k as ScentType] || 0) + (v as number);
    });

    // facet raw score: the numeric value (4/3/2/1) for this question's facet
    const rawValue = Object.values(option.scores)[0] as number;
    const newFacetRawScores = { ...facetRawScores, [current.facet as Facet]: rawValue };

    setTimeout(() => {
      setScoreHistory((h) => [...h, totalScores]);
      setFacetHistory((h) => [...h, facetRawScores]);
      setTotalScores(newScores);
      setFacetRawScores(newFacetRawScores);
      setSelectedId(null);
      setDirection(1);
      if (currentIndex < scentQuestions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        onComplete(newScores, newFacetRawScores);
      }
    }, 500);
  };

  const handleBack = () => {
    if (selectedId) return;
    if (currentIndex === 0) {
      onBack();
    } else {
      setDirection(-1);
      setTotalScores(scoreHistory[scoreHistory.length - 1] as Record<ScentType, number>);
      setFacetRawScores(facetHistory[facetHistory.length - 1] ?? {});
      setScoreHistory((h) => h.slice(0, -1));
      setFacetHistory((h) => h.slice(0, -1));
      setCurrentIndex((i) => i - 1);
    }
  };

  return (
    <motion.div
      className="fixed left-0 right-0 bottom-0 flex flex-col overflow-hidden"
      style={{ top: "56px", background: "#ffffff" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Header ── */}
      <div style={{ padding: "28px 32px 24px", flexShrink: 0 }}>
        {/* Label + counter row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-px w-5" style={{ background: ACCENT }} />
            <span
              className="font-semibold uppercase"
              style={{ fontSize: "13px", letterSpacing: "0.28em", color: ACCENT }}
            >
              {current.category}
            </span>
          </div>
          <span
            className="font-semibold tabular-nums"
            style={{ fontSize: "13px", letterSpacing: "0.08em", color: "#999999" }}
          >
            {String(currentIndex + 1).padStart(2, "0")}
            <span style={{ margin: "0 5px", color: "#dddddd" }}>/</span>
            {String(scentQuestions.length).padStart(2, "0")}
          </span>
        </div>

        {/* Progress track */}
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: "3px", background: "#f0f0f0" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_LIGHT})` }}
            initial={{ width: `${(currentIndex / scentQuestions.length) * 100}%` }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Question + Options ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex flex-col items-center justify-center overflow-y-auto survey-scroll"
        style={{ padding: "0 24px 40px", scrollbarWidth: "none" }}
      >
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Question text */}
              <h2
                className="font-bold text-center whitespace-pre-line"
                style={{
                  fontSize: "clamp(1.6rem, 4.5vw, 2.2rem)",
                  lineHeight: 1.35,
                  letterSpacing: "-0.025em",
                  color: "#111111",
                  marginBottom: "2.5rem",
                }}
              >
                {current.text}
              </h2>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {current.options.map((option, i) => {
                  const isSelected = selectedId === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => handleSelect(option.id)}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.055, duration: 0.35, type: "spring", stiffness: 300, damping: 20 }}
                      whileHover={!selectedId ? { y: -2 } : {}}
                      whileTap={!selectedId ? { scale: 0.99 } : {}}
                      className="w-full text-left transition-all duration-200"
                      style={{ cursor: selectedId ? "default" : "pointer" }}
                    >
                      <div
                        className="flex items-center gap-4"
                        style={{
                          padding: "18px 22px",
                          borderRadius: "14px",
                          border: "1.5px solid",
                          borderColor: isSelected ? ACCENT : "#e8e8e8",
                          background: isSelected ? "#fdf5f5" : "#ffffff",
                          boxShadow: isSelected
                            ? `0 4px 16px rgba(74,14,20,0.10)`
                            : "0 1px 4px rgba(0,0,0,0.04)",
                          transition: "all 0.2s",
                        }}
                      >
                        {/* Index badge */}
                        <span
                          className="flex-shrink-0 flex items-center justify-center font-semibold"
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            fontSize: "12px",
                            letterSpacing: "0.03em",
                            border: "1.5px solid",
                            borderColor: isSelected ? ACCENT : "#dddddd",
                            color: isSelected ? ACCENT : "#aaaaaa",
                            background: isSelected ? "#f5e0e2" : "#fafafa",
                            transition: "all 0.2s",
                            flexShrink: 0,
                          }}
                        >
                          {option.id.toUpperCase()}
                        </span>

                        {/* Option text */}
                        <span
                          className="font-medium flex-1"
                          style={{
                            fontSize: "0.97rem",
                            color: isSelected ? "#111111" : "#444444",
                            lineHeight: 1.5,
                            transition: "color 0.2s",
                          }}
                        >
                          {option.text}
                        </span>

                        {/* Checkmark */}
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{
                              flexShrink: 0,
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              background: ACCENT,
                              color: "#fff",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            ✓
                          </motion.span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}

                {/* Back button */}
                <motion.button
                  onClick={handleBack}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 4 * 0.055, duration: 0.35, type: "spring", stiffness: 300, damping: 20 }}
                  className="w-full flex justify-center"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    fontSize: "14px",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    padding: "8px 16px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#4b5563")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
                >
                  ← 이전
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`.survey-scroll::-webkit-scrollbar { display: none; }`}</style>
    </motion.div>
  );
}
