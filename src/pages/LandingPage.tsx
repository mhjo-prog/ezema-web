import { useEffect } from "react";
import { motion } from "framer-motion";
import { supabase, isSupabaseReady } from "../lib/supabase";

interface Props {
  onStart: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const constitutions = [
  {
    name: "태양인",
    hanja: "太陽人",
    keyword: "창의 · 진취",
    desc: "폐(肺)가 강하고 간(肝)이 약합니다.\n독창적이고 사회적 영향력을 중시합니다.",
    color: "#E8460A",
  },
  {
    name: "소양인",
    hanja: "少陽人",
    keyword: "활동 · 외향",
    desc: "비(脾)가 강하고 신(腎)이 약합니다.\n활발하고 추진력이 넘칩니다.",
    color: "#0774C4",
  },
  {
    name: "태음인",
    hanja: "太陰人",
    keyword: "신중 · 끈기",
    desc: "간(肝)이 강하고 폐(肺)가 약합니다.\n묵직하고 목표 지향적입니다.",
    color: "#1E8A4C",
  },
  {
    name: "소음인",
    hanja: "少陰人",
    keyword: "섬세 · 배려",
    desc: "신(腎)이 강하고 비(脾)가 약합니다.\n치밀하고 내면이 풍부합니다.",
    color: "#6B3FA0",
  },
];

export default function LandingPage({ onStart }: Props) {
  useEffect(() => {
    if (isSupabaseReady) {
      supabase.from("analytics").insert({ event_type: "page_visit" });
    }
  }, []);

  return (
    <motion.div
      className="fixed left-0 right-0 bottom-0 overflow-y-auto"
      style={{ top: "56px" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Hero Section ── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            width: "100%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Label */}
          <motion.div
            className="flex items-center gap-3"
            style={{ marginBottom: "1.25rem" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.55 }}
          >
            <div style={{ height: "1px", width: "28px", background: "#0774C4", flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: "11px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#0774C4", whiteSpace: "nowrap" }}>
              AI Constitution Analysis
            </span>
            <div style={{ height: "1px", width: "28px", background: "#0774C4", flexShrink: 0 }} />
          </motion.div>

          {/* Headline */}
          <motion.h1
            style={{
              fontWeight: 800,
              fontSize: "clamp(3.5rem, 7vw, 4.5rem)",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111111",
              marginBottom: "1.25rem",
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            당신의 체질을
            <br />
            <span style={{ color: "#0774C4" }}>알아보세요</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            style={{
              fontSize: "1.0625rem",
              fontWeight: 400,
              color: "#666666",
              lineHeight: 1.75,
              marginBottom: "2.5rem",
              maxWidth: "420px",
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            간단한 질문으로 나의 사상체질 유형과
            <br />
            체질별 맞춤 건강 가이드를 확인해보세요
          </motion.p>

          {/* CTA */}
          <motion.button
            onClick={onStart}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.55 }}
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.975 }}
            style={{
              padding: "16px 56px",
              borderRadius: "50px",
              background: "#0774C4",
              color: "#ffffff",
              fontSize: "1rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
              boxShadow: "0 4px 20px rgba(7,116,196,0.28)",
            }}
          >
            체질 테스트 시작하기
          </motion.button>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            style={{ marginTop: "4rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
          >
            <span style={{ fontSize: "11px", letterSpacing: "0.1em", color: "#bbbbbb", textTransform: "uppercase" }}>scroll</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "1px", height: "24px", background: "#dddddd" }}
            />
          </motion.div>
        </div>
      </section>

      {/* ── Result Preview Section ── */}
      <section style={{ padding: "clamp(56px, 8vw, 100px) 24px", background: "#f7f8fa" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <motion.div
            {...fadeUp}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "clamp(32px, 5vw, 64px)", alignItems: "center" }}
          >
            {/* Left: Text */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "4px", height: "18px", background: "#1E8A4C", borderRadius: "2px" }} />
                <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#1E8A4C" }}>
                  Result Preview
                </span>
              </div>
              <h2 style={{ fontWeight: 800, fontSize: "clamp(1.875rem, 4vw, 2.75rem)", letterSpacing: "-0.035em", lineHeight: 1.2, color: "#111111" }}>
                체질 검사를 하면<br />이런 결과를 받아요
              </h2>
              <p style={{ fontSize: "1rem", fontWeight: 400, color: "#666666", lineHeight: 1.8, maxWidth: "360px" }}>
                나의 사상체질 유형과 맞춤 건강 가이드를<br />한눈에 확인할 수 있어요
              </p>
              <div>
                <motion.button
                  onClick={onStart}
                  whileHover={{ scale: 1.025 }}
                  whileTap={{ scale: 0.975 }}
                  style={{ padding: "14px 36px", borderRadius: "50px", background: "#111111", color: "#ffffff", fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "0.02em", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
                >
                  지금 체질 검사하기
                </motion.button>
              </div>
            </div>

            {/* Right: 카드 1장 */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                  style={{
                    width: "100%",
                    maxWidth: "300px",
                    background: "#ffffff", borderRadius: "20px", padding: "24px 22px",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                    transform: "rotate(2deg)",
                    display: "flex", flexDirection: "column", gap: "14px",
                  }}
                >
                  {/* Badge */}
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#1E8A4C", color: "#ffffff", fontWeight: 700, fontSize: "0.875rem", padding: "6px 14px", borderRadius: "50px" }}>
                      태음인
                      <span style={{ fontWeight: 400, fontSize: "0.7rem", opacity: 0.85 }}>太陰人</span>
                    </span>
                  </div>

                  {/* Keywords */}
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                    {["신중", "끈기", "목표지향"].map((kw) => (
                      <span key={kw} style={{ fontSize: "11px", fontWeight: 600, color: "#1E8A4C", background: "#1E8A4C18", padding: "3px 9px", borderRadius: "50px" }}>
                        {kw}
                      </span>
                    ))}
                  </div>

                  {/* Radar — 마름모 */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <svg width="110" height="110" viewBox="0 0 120 120">
                      {[1.0, 0.66, 0.33].map((level) => (
                        <polygon key={level} points={`60,${60 - 44 * level} ${60 + 44 * level},60 60,${60 + 44 * level} ${60 - 44 * level},60`} fill="none" stroke="#eeeeee" strokeWidth="1.2" />
                      ))}
                      <line x1="60" y1="16" x2="60" y2="104" stroke="#e0e0e0" strokeWidth="1" />
                      <line x1="16" y1="60" x2="104" y2="60" stroke="#e0e0e0" strokeWidth="1" />
                      <polygon points="60,50 74,60 60,88 40,60" fill="#1E8A4C22" stroke="#1E8A4C" strokeWidth="1.8" strokeLinejoin="round" />
                      <circle cx="60" cy="50" r="3" fill="#1E8A4C" />
                      <circle cx="74" cy="60" r="3" fill="#1E8A4C" />
                      <circle cx="60" cy="88" r="3" fill="#1E8A4C" />
                      <circle cx="40" cy="60" r="3" fill="#1E8A4C" />
                      <text x="60" y="11" textAnchor="middle" fontSize="9" fontWeight="700" fill="#888">태</text>
                      <text x="112" y="64" textAnchor="start" fontSize="9" fontWeight="700" fill="#888">양</text>
                      <text x="60" y="114" textAnchor="middle" fontSize="9" fontWeight="700" fill="#888">소</text>
                      <text x="8" y="64" textAnchor="end" fontSize="9" fontWeight="700" fill="#888">음</text>
                    </svg>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: "0.8rem", color: "#555555", lineHeight: 1.65, textAlign: "center" }}>
                    간(肝)이 강하고 폐(肺)가 약한 체질입니다.
                  </p>

                  {/* Drink tags */}
                  <div>
                    <p style={{ fontSize: "10px", color: "#aaaaaa", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "7px" }}>추천 음료</p>
                    <div style={{ display: "flex", gap: "5px" }}>
                      {["율무차", "매실", "오미자", "칡"].map((drink) => (
                        <span key={drink} style={{ fontSize: "11px", color: "#444444", background: "#f5f5f5", padding: "3px 9px", borderRadius: "50px", fontWeight: 500 }}>
                          {drink}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Constitution Section ── */}
      <section style={{ padding: "clamp(56px, 8vw, 100px) 24px", background: "#ffffff" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>

          {/* Section header */}
          <motion.div
            {...fadeUp}
            style={{ marginBottom: "48px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: "4px", height: "18px", background: "#E8460A", borderRadius: "2px" }} />
              <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#E8460A" }}>
                Sasang Constitution
              </span>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(1.875rem, 4vw, 2.5rem)", letterSpacing: "-0.03em", color: "#111111", marginBottom: "12px" }}>
              사상체질이란?
            </h2>
            <p style={{ fontSize: "1rem", fontWeight: 400, color: "#666666", lineHeight: 1.75, maxWidth: "100%" }}>
              사상체질은 조선 말기 이제마가 창시한 한의학 이론으로, 사람을 태양인·소양인·태음인·소음인 4가지 유형으로 분류하여 체질별 장부 기능과 성정(性情)에 맞춰 치료와 섭생을 달리하는 맞춤 의학입니다. 태음인이 약 40%로 가장 많고 소양인, 소음인 순이며 태양인은 매우 적습니다.
            </p>
          </motion.div>

          {/* Cards grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "16px",
            }}
          >
            {constitutions.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: "easeOut" }}
                style={{
                  background: "#ffffff",
                  border: "1px solid #eeeeee",
                  borderRadius: "16px",
                  padding: "28px 24px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Color accent top bar */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: c.color,
                  }}
                />
                {/* Keyword badge */}
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    color: c.color,
                    background: `${c.color}14`,
                    padding: "3px 10px",
                    borderRadius: "50px",
                    marginBottom: "12px",
                  }}
                >
                  {c.keyword}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111111" }}>{c.name}</span>
                  <span style={{ fontSize: "0.8rem", color: "#aaaaaa", letterSpacing: "0.05em" }}>{c.hanja}</span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "#666666", lineHeight: 1.7 }}>
                  {c.desc.split("\n").map((line, i) => (
                    <span key={i}>{line}{i < c.desc.split("\n").length - 1 && <br />}</span>
                  ))}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brand Section ── */}
      <section style={{ background: "#f7f8fa", padding: "clamp(56px, 8vw, 100px) 24px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <motion.div
            {...fadeUp}
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "4px", height: "18px", background: "#6B3FA0", borderRadius: "2px" }} />
              <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B3FA0" }}>
                KeepSlow
              </span>
            </div>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.875rem, 4vw, 2.5rem)",
                letterSpacing: "-0.03em",
                lineHeight: 1.25,
                color: "#111111",
              }}
            >
              이기적이지 않은 건강함<br />Selfless Wellness
            </h2>
            <p
              style={{
                fontSize: "1rem",
                fontWeight: 400,
                color: "#666666",
                lineHeight: 1.8,
                maxWidth: "100%",
              }}
            >
              나의 건강 뿐만 아니라, 소중한 사람의 안녕을 챙기는<br />이기적이지 않은 건강 문화를 선도합니다.
            </p>
            <motion.button
              onClick={onStart}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.975 }}
              className="w-full sm:w-auto"
              style={{
                marginTop: "8px",
                padding: "15px 40px",
                borderRadius: "50px",
                background: "#6B3FA0",
                color: "#ffffff",
                fontSize: "0.9375rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
                boxShadow: "0 4px 16px rgba(107,63,160,0.25)",
              }}
            >
              내 체질 알아보기
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#ffffff", padding: "32px 24px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "11px", color: "#aaaaaa", lineHeight: 2 }}>
            본 설문은 '이제마 동의수세보원(東醫壽世保元)' 내용을 기반으로 제작되었습니다.
          </p>
          <p style={{ fontSize: "11px", color: "#cccccc", marginTop: "12px" }}>
            © 2026 KeepSlow. All rights reserved.
          </p>
        </div>
      </footer>
    </motion.div>
  );
}
