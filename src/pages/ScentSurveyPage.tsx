import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PART_A_QUESTIONS,
  SCENT_CATEGORIES,
  SPACES,
  SAFETY_FLAGS,
  AGE_GROUPS,
} from "../data/surveyV2";
import type {
  ScentCategoryV2,
  SpaceV2,
  SafetyFlagV2,
  AgeGroupV2,
} from "../data/surveyV2";

const ACCENT = "#4A0E14";
const ACCENT_LIGHT = "#7A2A32";
const TOTAL = 20; // Part A 15 + Part B 5

export interface PartBAnswers {
  preferences: ScentCategoryV2[];
  avoided: ScentCategoryV2[];
  space: SpaceV2 | null;
  safetyFlags: SafetyFlagV2[];
  age: AgeGroupV2 | null;
}

interface Props {
  onComplete: (itemScores: Record<string, number>, partB: PartBAnswers) => void;
  onBack: () => void;
}

interface PartBQuestionDef {
  id: string;
  text: string;
  multi: boolean;
  options: readonly string[];
  needsConsent?: boolean;
  skipLabel?: string;
}

const PART_B_QUESTIONS: PartBQuestionDef[] = [
  {
    id: "Q16",
    text: "어떤 향 계열을 선호하시나요?\n복수 선택 가능해요",
    multi: true,
    options: SCENT_CATEGORIES,
    skipLabel: "없음 / 모르겠어요",
  },
  {
    id: "Q17",
    text: "선호하지 않는 향 계열이 있나요?\n없으면 건너뛰기를 눌러주세요",
    multi: true,
    options: SCENT_CATEGORIES,
    skipLabel: "없어요",
  },
  {
    id: "Q18",
    text: "주로 어떤 공간에서 사용하실 건가요?",
    multi: false,
    options: SPACES,
  },
  {
    id: "Q19",
    text: "해당되는 사항을 모두 선택해주세요\n없으면 건너뛰기를 눌러주세요",
    multi: true,
    options: SAFETY_FLAGS.map((f) => f.label),
    needsConsent: true,
    skipLabel: "해당 없어요",
  },
  {
    id: "Q20",
    text: "연령대를 알려주세요",
    multi: false,
    options: [...AGE_GROUPS],
  },
];

export default function ScentSurveyPage({ onComplete, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0); // 0‑19
  const [direction, setDirection] = useState(1);

  // Part A state
  const [itemScores, setItemScores] = useState<Record<string, number>>({});
  const [itemScoreHistory, setItemScoreHistory] = useState<
    Record<string, number>[]
  >([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Part B committed answers (ref keeps them accessible in effects without stale closure)
  const partBRef = useRef<PartBAnswers>({
    preferences: [],
    avoided: [],
    space: null,
    safetyFlags: [],
    age: null,
  });

  // Part B multi-select: current working selection before committing
  const [partBCurrentSelected, setPartBCurrentSelected] = useState<string[]>([]);
  const [safetyConsent, setSafetyConsent] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top on question change
  useEffect(() => {
    scrollContainerRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentIndex]);

  // When entering a Part B multi-select question, restore previously committed answers
  useEffect(() => {
    if (currentIndex < 15) return;
    const q = PART_B_QUESTIONS[currentIndex - 15];
    if (!q.multi) {
      setPartBCurrentSelected([]);
      return;
    }
    const ans = partBRef.current;
    switch (q.id) {
      case "Q16": setPartBCurrentSelected([...ans.preferences]); break;
      case "Q17": setPartBCurrentSelected([...ans.avoided]); break;
      case "Q19": {
        // Restore safety keys from stored flags
        const labels = SAFETY_FLAGS.filter((f) =>
          ans.safetyFlags.includes(f.key)
        ).map((f) => f.label);
        setPartBCurrentSelected(labels);
        break;
      }
      default: setPartBCurrentSelected([]);
    }
  }, [currentIndex]);

  const isPartA = currentIndex < 15;
  const partBQuestion = !isPartA ? PART_B_QUESTIONS[currentIndex - 15] : null;

  const progressPct = ((currentIndex + 1) / TOTAL) * 100;
  const displayNum = String(currentIndex + 1).padStart(2, "0");

  // ── Part A ──
  const handlePartASelect = (optionIdx: number) => {
    if (selectedId) return;
    const q = PART_A_QUESTIONS[currentIndex];
    const option = q.options[optionIdx];
    const optionId = `${q.id}-${optionIdx}`;
    setSelectedId(optionId);
    const newScores = { ...itemScores, [q.id]: option.score };

    setTimeout(() => {
      setItemScoreHistory((h) => [...h, itemScores]);
      setItemScores(newScores);
      setSelectedId(null);
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }, 500);
  };

  const handleBack = () => {
    if (isPartA) {
      if (selectedId) return;
      if (currentIndex === 0) {
        onBack();
      } else {
        setDirection(-1);
        setItemScores(itemScoreHistory[itemScoreHistory.length - 1] ?? {});
        setItemScoreHistory((h) => h.slice(0, -1));
        setCurrentIndex((i) => i - 1);
      }
    } else {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  };

  // ── Part B ──
  const handlePartBMultiToggle = (label: string) => {
    setPartBCurrentSelected((prev) =>
      prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]
    );
  };

  const commitAndAdvance = (newAnswers: PartBAnswers) => {
    partBRef.current = newAnswers;
    if (currentIndex < TOTAL - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    } else {
      onComplete(itemScores, newAnswers);
    }
  };

  const handlePartBNext = () => {
    const q = partBQuestion!;
    const newAnswers = { ...partBRef.current };
    switch (q.id) {
      case "Q16":
        newAnswers.preferences = partBCurrentSelected as ScentCategoryV2[];
        break;
      case "Q17":
        newAnswers.avoided = partBCurrentSelected as ScentCategoryV2[];
        break;
      case "Q19": {
        // Map labels back to keys
        const selectedKeys = SAFETY_FLAGS.filter((f) =>
          partBCurrentSelected.includes(f.label)
        ).map((f) => f.key);
        newAnswers.safetyFlags = selectedKeys;
        break;
      }
    }
    commitAndAdvance(newAnswers);
  };

  const handlePartBSkip = () => {
    // Treat as empty selection
    setPartBCurrentSelected([]);
    const newAnswers = { ...partBRef.current };
    const q = partBQuestion!;
    switch (q.id) {
      case "Q16": newAnswers.preferences = []; break;
      case "Q17": newAnswers.avoided = []; break;
      case "Q19": newAnswers.safetyFlags = []; break;
    }
    commitAndAdvance(newAnswers);
  };

  const handlePartBSingle = (val: string) => {
    const newAnswers = { ...partBRef.current };
    const q = partBQuestion!;
    switch (q.id) {
      case "Q18": newAnswers.space = val as SpaceV2; break;
      case "Q20": newAnswers.age = val as AgeGroupV2; break;
    }
    setTimeout(() => commitAndAdvance(newAnswers), 400);
  };

  const partAQuestion = isPartA ? PART_A_QUESTIONS[currentIndex] : null;

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-px w-5" style={{ background: ACCENT }} />
            <span
              className="font-semibold uppercase"
              style={{ fontSize: "13px", letterSpacing: "0.28em", color: ACCENT }}
            >
              {isPartA ? "상태 진단" : "취향 & 안전"}
            </span>
          </div>
          <span
            className="font-semibold tabular-nums"
            style={{ fontSize: "13px", letterSpacing: "0.08em", color: "#999999" }}
          >
            {displayNum}
            <span style={{ margin: "0 5px", color: "#dddddd" }}>/</span>
            {String(TOTAL).padStart(2, "0")}
          </span>
        </div>

        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: "3px", background: "#f0f0f0" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_LIGHT})`,
            }}
            initial={{ width: `${(currentIndex / TOTAL) * 100}%` }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Question + Options ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex flex-col items-center overflow-y-auto survey-scroll"
        style={{ padding: "0 24px 40px", scrollbarWidth: "none" }}
      >
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            {isPartA && partAQuestion ? (
              /* ── Part A: single-select, auto-advance ── */
              <motion.div
                key={currentIndex}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              >
                <h2
                  className="font-bold text-center whitespace-pre-line"
                  style={{
                    fontSize: "clamp(1.6rem, 4.5vw, 2.2rem)",
                    lineHeight: 1.35,
                    letterSpacing: "-0.025em",
                    color: "#111111",
                    marginBottom: "2.5rem",
                    marginTop: "1rem",
                  }}
                >
                  {partAQuestion.text}
                </h2>

                <div className="flex flex-col gap-3">
                  {partAQuestion.options.map((option, i) => {
                    const optionId = `${partAQuestion.id}-${i}`;
                    const isSelected = selectedId === optionId;
                    return (
                      <motion.button
                        key={optionId}
                        onClick={() => handlePartASelect(i)}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: i * 0.055,
                          duration: 0.35,
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
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
                              ? "0 4px 16px rgba(74,14,20,0.10)"
                              : "0 1px 4px rgba(0,0,0,0.04)",
                            transition: "all 0.2s",
                          }}
                        >
                          <span
                            translate="no"
                            className="notranslate flex-shrink-0 flex items-center justify-center font-semibold"
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
                            {String.fromCharCode(65 + i)}
                          </span>

                          <span
                            className="font-medium flex-1"
                            style={{
                              fontSize: "0.97rem",
                              color: isSelected ? "#111111" : "#444444",
                              lineHeight: 1.5,
                              transition: "color 0.2s",
                            }}
                          >
                            {option.label}
                          </span>

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

                  <motion.button
                    onClick={handleBack}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 4 * 0.055,
                      duration: 0.35,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#4b5563")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#9ca3af")
                    }
                  >
                    ← 이전
                  </motion.button>
                </div>
              </motion.div>
            ) : partBQuestion ? (
              /* ── Part B ── */
              <motion.div
                key={currentIndex}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              >
                <h2
                  className="font-bold text-center whitespace-pre-line"
                  style={{
                    fontSize: "clamp(1.35rem, 4vw, 1.9rem)",
                    lineHeight: 1.4,
                    letterSpacing: "-0.02em",
                    color: "#111111",
                    marginBottom: "1.5rem",
                    marginTop: "1rem",
                  }}
                >
                  {partBQuestion.text}
                </h2>

                {/* Q19 consent checkbox */}
                {partBQuestion.needsConsent && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      background: "#fffbee",
                      border: "1px solid #f0e68c",
                      marginBottom: "16px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={safetyConsent}
                      onChange={(e) => setSafetyConsent(e.target.checked)}
                      style={{ marginTop: "2px", accentColor: ACCENT, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "0.82rem", color: "#665500", lineHeight: 1.55 }}>
                      건강 관련 정보는 안전한 향 추천을 위해서만 사용되며 외부에 공유되지 않습니다.
                      이에 동의하시면 아래 해당 항목을 선택해 주세요.
                    </span>
                  </label>
                )}

                {/* Options */}
                <div className="flex flex-col gap-3">
                  {partBQuestion.multi ? (
                    /* Multi-select options */
                    <>
                      {partBQuestion.options.map((label, i) => {
                        const isSelected = partBCurrentSelected.includes(label);
                        const disabled =
                          partBQuestion.needsConsent && !safetyConsent;
                        return (
                          <motion.button
                            key={label}
                            onClick={() =>
                              !disabled && handlePartBMultiToggle(label)
                            }
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.3 }}
                            whileTap={!disabled ? { scale: 0.99 } : {}}
                            className="w-full text-left"
                            style={{ cursor: disabled ? "not-allowed" : "pointer" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "14px",
                                padding: "16px 20px",
                                borderRadius: "14px",
                                border: "1.5px solid",
                                borderColor: isSelected ? ACCENT : "#e8e8e8",
                                background: isSelected
                                  ? "#fdf5f5"
                                  : disabled
                                  ? "#fafafa"
                                  : "#ffffff",
                                opacity: disabled ? 0.5 : 1,
                                transition: "all 0.18s",
                              }}
                            >
                              {/* Checkbox indicator */}
                              <span
                                style={{
                                  flexShrink: 0,
                                  width: "22px",
                                  height: "22px",
                                  borderRadius: "6px",
                                  border: "1.5px solid",
                                  borderColor: isSelected ? ACCENT : "#cccccc",
                                  background: isSelected ? ACCENT : "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "all 0.18s",
                                }}
                              >
                                {isSelected && (
                                  <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>
                                    ✓
                                  </span>
                                )}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.95rem",
                                  fontWeight: isSelected ? 600 : 400,
                                  color: isSelected ? "#111" : "#444",
                                  lineHeight: 1.5,
                                  transition: "all 0.18s",
                                }}
                              >
                                {label}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}

                      {/* Next / Skip buttons */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                        <motion.button
                          onClick={handlePartBNext}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: partBQuestion.options.length * 0.04 + 0.05 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            width: "100%",
                            padding: "16px",
                            borderRadius: "14px",
                            background: ACCENT,
                            border: "none",
                            color: "#ffffff",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            opacity:
                              partBQuestion.needsConsent && !safetyConsent ? 0.4 : 1,
                          }}
                          disabled={partBQuestion.needsConsent && !safetyConsent}
                        >
                          {partBCurrentSelected.length > 0
                            ? `선택 완료 (${partBCurrentSelected.length}개)`
                            : "다음"}
                        </motion.button>

                        {partBQuestion.skipLabel && (
                          <motion.button
                            onClick={handlePartBSkip}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: partBQuestion.options.length * 0.04 + 0.1 }}
                            style={{
                              width: "100%",
                              padding: "10px",
                              background: "none",
                              border: "none",
                              color: "#9ca3af",
                              fontSize: "14px",
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            {partBQuestion.skipLabel} →
                          </motion.button>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Single-select: auto-advance */
                    partBQuestion.options.map((label, i) => (
                      <motion.button
                        key={label}
                        onClick={() => handlePartBSingle(label)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.055, duration: 0.35, type: "spring", stiffness: 300, damping: 20 }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full text-left"
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            padding: "18px 22px",
                            borderRadius: "14px",
                            border: "1.5px solid #e8e8e8",
                            background: "#ffffff",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                            transition: "all 0.2s",
                          }}
                        >
                          <span
                            className="notranslate flex-shrink-0 flex items-center justify-center font-semibold"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              fontSize: "12px",
                              border: "1.5px solid #dddddd",
                              color: "#aaaaaa",
                              background: "#fafafa",
                            }}
                          >
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span
                            className="font-medium flex-1"
                            style={{ fontSize: "0.97rem", color: "#444444", lineHeight: 1.5 }}
                          >
                            {label}
                          </span>
                        </div>
                      </motion.button>
                    ))
                  )}

                  <motion.button
                    onClick={handleBack}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="w-full flex justify-center"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#9ca3af",
                      fontSize: "14px",
                      fontWeight: 500,
                      padding: "8px 16px",
                      marginTop: "4px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#4b5563")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
                  >
                    ← 이전
                  </motion.button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <style>{`.survey-scroll::-webkit-scrollbar { display: none; }`}</style>
    </motion.div>
  );
}
