import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions } from "../data/questions";

interface Props {
  onComplete: (scores: Record<string, number>) => void;
  onBack: () => void;
}

export default function SurveyPage({ onComplete, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const [totalScores, setTotalScores] = useState<Record<string, number>>({
    태양인: 0,
    소양인: 0,
    태음인: 0,
    소음인: 0,
  });
  const [scoreHistory, setScoreHistory] = useState<Record<string, number>[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentIndex]);

  const current = questions[currentIndex];
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  const handleSelect = (optionId: string) => {
    if (selectedId) return;
    setSelectedId(optionId);

    const option = current.options.find((o) => o.id === optionId)!;
    const newScores = { ...totalScores };
    Object.entries(option.scores).forEach(([k, v]) => {
      newScores[k] = (newScores[k] || 0) + v;
    });

    setTimeout(() => {
      setScoreHistory((h) => [...h, totalScores]);
      setTotalScores(newScores);
      setSelectedId(null);
      setDirection(1);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        onComplete(newScores);
      }
    }, 500);
  };

  const handleBack = () => {
    if (selectedId) return;
    if (currentIndex === 0) {
      onBack();
    } else {
      setDirection(-1);
      setTotalScores(scoreHistory[scoreHistory.length - 1]);
      setScoreHistory((h) => h.slice(0, -1));
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
            <div className="h-px w-5" style={{ background: "#0774C4" }} />
            <span
              className="font-semibold uppercase"
              style={{ fontSize: "13px", letterSpacing: "0.28em", color: "#0774C4" }}
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
            {String(questions.length).padStart(2, "0")}
          </span>
        </div>

        {/* Progress track */}
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: "3px", background: "#f0f0f0" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #0774C4, #8EBEF9)" }}
            initial={{ width: `${((currentIndex) / questions.length) * 100}%` }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

      </div>

      {/* ── Question + Options ── */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 flex flex-col items-center overflow-y-auto ${[15, 16, 19].includes(current.id) ? 'justify-start' : 'justify-center'}`}
        style={{ padding: "40px 24px" }}
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
                          borderColor: isSelected ? "#0774C4" : "#e8e8e8",
                          background: isSelected ? "#f0f7ff" : "#ffffff",
                          boxShadow: isSelected
                            ? "0 4px 16px rgba(7,116,196,0.12)"
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
                            borderColor: isSelected ? "#0774C4" : "#dddddd",
                            color: isSelected ? "#0774C4" : "#aaaaaa",
                            background: isSelected ? "#ddeeff" : "#fafafa",
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
                              background: "#0774C4",
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

                {/* Back button — inside options group */}
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
    </motion.div>
  );
}
