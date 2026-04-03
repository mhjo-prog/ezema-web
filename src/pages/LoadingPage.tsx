import { useEffect } from "react";
import { motion } from "framer-motion";

interface Props {
  onComplete: () => void;
}

const steps = [
  { label: "체질 데이터 분석 중", en: "Analyzing constitution data" },
  { label: "에너지 패턴 측정 중", en: "Measuring energy patterns" },
  { label: "맞춤 결과 생성 중",   en: "Generating personalized result" },
];

export default function LoadingPage({ onComplete }: Props) {
  useEffect(() => {
    const t = setTimeout(onComplete, 3400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="fixed left-0 right-0 bottom-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ top: "56px", background: "#ffffff" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: "3px", background: "linear-gradient(90deg, #0774C4, #8EBEF9)" }}
      />

      <div className="flex flex-col items-center py-16">

        {/* Section label */}
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="h-px w-8" style={{ background: "#0774C4" }} />
          <span
            className="font-semibold uppercase"
            style={{ fontSize: "10px", letterSpacing: "0.3em", color: "#0774C4" }}
          >
            AI Analyzing
          </span>
          <div className="h-px w-8" style={{ background: "#0774C4" }} />
        </motion.div>

        {/* Spinner */}
        <div className="relative mb-28" style={{ width: "80px", height: "80px", marginTop: "24px" }}>
          {/* Outer track */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ border: "3px solid #f0f0f0" }}
          />
          {/* Spinning arc */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: "3px solid transparent",
              borderTopColor: "#0774C4",
              borderRightColor: "#8EBEF9",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner dot */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [0.85, 1, 0.85] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="rounded-full"
              style={{
                width: "12px",
                height: "12px",
                background: "linear-gradient(135deg, #8EBEF9, #0774C4)",
              }}
            />
          </motion.div>
        </div>

        {/* Steps */}
        <div className="flex flex-col items-center gap-16" style={{ marginTop: "24px" }}>
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.95 + 0.3, duration: 0.5 }}
            >
              <span
                className="font-semibold"
                style={{ fontSize: "1.25rem", color: "#222222", letterSpacing: "-0.02em" }}
              >
                {step.label}
              </span>
              <span
                style={{ fontSize: "13px", color: "#aaaaaa", letterSpacing: "0.04em" }}
              >
                {step.en}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="absolute bottom-14 left-1/2 -translate-x-1/2 rounded-full overflow-hidden"
        style={{ width: "160px", height: "2px", background: "#f0f0f0" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #0774C4, #8EBEF9)" }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 3.2, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
