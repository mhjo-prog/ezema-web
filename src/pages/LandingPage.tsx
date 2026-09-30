import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { supabase, isSupabaseReady } from "../lib/supabase";
import Footer from "../components/Footer";
import { CONSTITUTION_COLORS } from "../data/results";
import { isProductionEnv } from "../lib/env";

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
    color: CONSTITUTION_COLORS["태양인"],
  },
  {
    name: "소양인",
    hanja: "少陽人",
    keyword: "활동 · 외향",
    desc: "비(脾)가 강하고 신(腎)이 약합니다.\n활발하고 추진력이 넘칩니다.",
    color: CONSTITUTION_COLORS["소양인"],
  },
  {
    name: "태음인",
    hanja: "太陰人",
    keyword: "신중 · 끈기",
    desc: "간(肝)이 강하고 폐(肺)가 약합니다.\n묵직하고 목표 지향적입니다.",
    color: CONSTITUTION_COLORS["태음인"],
  },
  {
    name: "소음인",
    hanja: "少陰人",
    keyword: "섬세 · 배려",
    desc: "신(腎)이 강하고 비(脾)가 약합니다.\n치밀하고 내면이 풍부합니다.",
    color: CONSTITUTION_COLORS["소음인"],
  },
];

export default function LandingPage({ onStart }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isSupabaseReady && isProductionEnv) {
      supabase.from("analytics").insert({ event_type: "page_visit" })
        .then(({ error }) => { if (error) console.log("[analytics] insert error:", error); });
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>사상체질 자가진단 테스트 | 무료 체질검사 - 킵슬로우(Keepslow)</title>
        <meta name="description" content="태양인·태음인·소양인·소음인 사상체질을 무료로 자가진단해보세요. 31문항, 약 3분. 체질에 맞는 건강 가이드를 확인할 수 있습니다." />
        <meta property="og:title" content="사상체질 자가진단 테스트 | 무료 체질검사 - 킵슬로우(Keepslow)" />
        <meta property="og:description" content="태양인·태음인·소양인·소음인 사상체질을 무료로 자가진단해보세요. 31문항, 약 3분." />
        <meta property="og:url" content="https://keepslow.kr/test" />
        <link rel="canonical" href="https://keepslow.kr/test" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "사상체질 테스트가 정확한가요?",
              "acceptedAnswer": { "@type": "Answer", "text": "이제마의 『동의수세보원』에 기반한 자가진단 도구입니다. 한의원 전문 진단을 대체하지는 않지만, 체질 이해의 첫 걸음으로 활용할 수 있습니다." }
            },
            {
              "@type": "Question",
              "name": "무료인가요? 회원가입이 필요한가요?",
              "acceptedAnswer": { "@type": "Answer", "text": "완전 무료이며, 회원가입 없이 테스트를 진행하고 결과를 확인할 수 있습니다. 결과를 마이페이지에 저장하려면 카카오 로그인이 필요합니다." }
            },
            {
              "@type": "Question",
              "name": "네 가지 체질은 어떻게 다른가요?",
              "acceptedAnswer": { "@type": "Answer", "text": "태양인(폐 강·간 약), 태음인(간 강·폐 약), 소양인(비위 강·신장 약), 소음인(신장 강·비위 약)으로 구분됩니다. 각 체질은 고유한 성격, 체형 경향, 건강 취약점을 가집니다." }
            },
            {
              "@type": "Question",
              "name": "몇 문항이며 얼마나 걸리나요?",
              "acceptedAnswer": { "@type": "Answer", "text": "31문항이며, 평균 3분 이내에 완료할 수 있습니다." }
            },
            {
              "@type": "Question",
              "name": "결과를 다시 볼 수 있나요?",
              "acceptedAnswer": { "@type": "Answer", "text": "카카오 로그인 후 마이페이지에 저장하면 언제든 다시 확인할 수 있습니다." }
            }
          ]
        })}</script>
      </Helmet>
      <motion.div
      style={{ paddingTop: "56px" }}
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
          padding: "80px clamp(16px, 4vw, 40px)",
          background: "#ffffff",
        }}
      >
        <div
          className="hero-grid-container"
          style={{
            maxWidth: "1080px",
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            position: "relative",
          }}
        >
          {/* Vertical divider */}
          <div
            className="hero-divider"
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: "1px",
              background: "#eeeeee",
              transform: "translateX(-50%)",
              pointerEvents: "none",
            }}
          />

          {/* ── Left Column: Sasang Body Type Test ── */}
          <div
            className="hero-col hero-col-left"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "48px clamp(20px, 4vw, 64px)",
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
              <span className="lp-label" style={{ fontWeight: 600, fontSize: "11px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#0774C4", whiteSpace: "nowrap" }}>
                SASANG BODY TYPE TEST
              </span>
              <div style={{ height: "1px", width: "28px", background: "#0774C4", flexShrink: 0 }} />
            </motion.div>

            {/* Headline */}
            <motion.h1
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
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
                maxWidth: "360px",
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
              className="lp-cta-btn"
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

            {/* Scroll hint — left column only */}
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

          {/* ── Right Column: Scent Health Test ── */}
          <div
            className="hero-col hero-col-right"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "48px clamp(20px, 4vw, 64px)",
            }}
          >
            {/* Label */}
            <motion.div
              className="flex items-center gap-3"
              style={{ marginBottom: "1.25rem" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.55 }}
            >
              <div style={{ height: "1px", width: "28px", background: "#4A0E14", flexShrink: 0 }} />
              <span className="lp-label" style={{ fontWeight: 600, fontSize: "11px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#4A0E14", whiteSpace: "nowrap" }}>
                SCENT HEALTH TEST
              </span>
              <div style={{ height: "1px", width: "28px", background: "#4A0E14", flexShrink: 0 }} />
            </motion.div>

            {/* Headline */}
            <motion.h1
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                color: "#111111",
                marginBottom: "1.25rem",
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              당신에게 필요한
              <br />
              <span style={{ color: "#4A0E14" }}>향을</span> 알아보세요
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              style={{
                fontSize: "1.0625rem",
                fontWeight: 400,
                color: "#666666",
                lineHeight: 1.75,
                marginBottom: "2.5rem",
                maxWidth: "360px",
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.6 }}
            >
              간단한 질문으로 나의 생활 패턴을 진단하고
              <br />
              나에게 필요한 향과 사용법을 확인해보세요
            </motion.p>

            {/* CTA */}
            <motion.button
              onClick={() => navigate("/scent-quiz")}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.55 }}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.975 }}
              className="lp-cta-btn"
              style={{
                padding: "16px 56px",
                borderRadius: "50px",
                background: "#4A0E14",
                color: "#ffffff",
                fontSize: "1rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
                boxShadow: "0 4px 20px rgba(74,14,20,0.28)",
              }}
            >
              향 테스트 시작하기
            </motion.button>

            {/* Scroll hint — right column */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
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
        </div>
      </section>

      {/* ── Result Preview Section ── */}
      <section style={{ padding: "clamp(56px, 8vw, 100px) clamp(16px, 4vw, 40px)", background: "#f7f8fa" }}>
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
                  style={{ padding: "14px 36px", borderRadius: "50px", background: "#111111", color: "#ffffff", fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "0.02em", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
                >
                  지금 체질 검사하기
                </motion.button>
              </div>
            </div>

            {/* Right: 태음인 결과 카드 */}
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
      <section style={{ padding: "clamp(56px, 8vw, 100px) clamp(16px, 4vw, 40px)", background: "#ffffff" }}>
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
                className="constitution-card"
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
                  <span className="constitution-card-name" style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111111" }}>{c.name}</span>
                  <span style={{ fontSize: "0.8rem", color: "#aaaaaa", letterSpacing: "0.05em" }}>{c.hanja}</span>
                </div>
                <p className="constitution-card-desc" style={{ fontSize: "0.875rem", color: "#666666", lineHeight: 1.7 }}>
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
      <section style={{ background: "#f7f8fa", padding: "clamp(56px, 8vw, 100px) clamp(16px, 4vw, 40px)" }}>
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
              <motion.button
                onClick={onStart}
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.975 }}
                style={{
                  padding: "15px 40px",
                  borderRadius: "50px",
                  background: "#6B3FA014",
                  color: "#6B3FA0",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  boxShadow: "0 2px 8px rgba(107,63,160,0.15)",
                }}
              >
                내 체질 알아보기
              </motion.button>
              <motion.button
                onClick={() => navigate("/scent-quiz")}
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.975 }}
                style={{
                  padding: "15px 40px",
                  borderRadius: "50px",
                  background: "#7A1B2E14",
                  color: "#7A1B2E",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  boxShadow: "0 2px 8px rgba(122,27,46,0.12)",
                }}
              >
                내게 필요한 향 알아보기
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .hero-grid-container { grid-template-columns: 1fr !important; }
          .hero-divider { display: none !important; }
          .hero-col-left { border-bottom: 1px solid #eeeeee; }
          .hero-col { padding: 48px clamp(16px, 6vw, 40px) !important; }
        }
        @media (max-width: 480px) {
          .lp-label { font-size: 9px !important; letter-spacing: 0.18em !important; }
          .lp-cta-btn { padding: 12px 28px !important; font-size: 0.875rem !important; width: fit-content !important; }
          .constitution-card { padding: 18px 14px !important; border-radius: 12px !important; }
          .constitution-card-name { font-size: 1rem !important; }
          .constitution-card-desc { font-size: 0.8rem !important; word-break: keep-all !important; }
        }
      `}</style>

      {/* ── SEO: 사상체질 소개 + FAQ ── */}
      <section style={{ background: "#f8f8f6", padding: "72px clamp(20px, 5vw, 80px)" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.625rem)", fontWeight: 700, color: "#111111", marginBottom: "1rem", letterSpacing: "-0.03em" }}>
            사상체질이란?
          </h2>
          <p style={{ fontSize: "1rem", color: "#444444", lineHeight: 1.8, marginBottom: "0.75rem" }}>
            사상체질(四象體質)은 조선 후기 의학자 이제마가 창안한 체질 의학으로, 사람의 체질을 태양인·태음인·소양인·소음인 네 가지로 구분합니다. 체질마다 강한 장기와 약한 장기가 다르며, 건강을 지키는 방식과 잘 맞는 음식·생활 습관도 달라집니다.
          </p>
          <p style={{ fontSize: "1rem", color: "#444444", lineHeight: 1.8, marginBottom: "3rem" }}>
            킵슬로우의 사상체질 테스트는 완전 무료이며, 31가지 질문에 답하면 약 3분 안에 나의 체질 유형과 맞춤 건강 가이드를 확인할 수 있습니다.
          </p>

          <h2 style={{ fontSize: "clamp(1.125rem, 2vw, 1.375rem)", fontWeight: 700, color: "#111111", marginBottom: "1.5rem", letterSpacing: "-0.02em" }}>
            자주 묻는 질문
          </h2>
          <dl style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {([
              ["사상체질 테스트가 정확한가요?", "이제마의 『동의수세보원』에 기반한 자가진단 도구입니다. 한의원 전문 진단을 대체하지는 않지만, 체질 이해의 첫 걸음으로 활용할 수 있습니다."],
              ["무료인가요? 회원가입이 필요한가요?", "완전 무료이며, 회원가입 없이 테스트를 진행하고 결과를 확인할 수 있습니다. 결과를 마이페이지에 저장하려면 카카오 로그인이 필요합니다."],
              ["네 가지 체질은 어떻게 다른가요?", "태양인(폐 강·간 약), 태음인(간 강·폐 약), 소양인(비위 강·신장 약), 소음인(신장 강·비위 약)으로 구분됩니다. 각 체질은 고유한 성격, 체형 경향, 건강 취약점을 가집니다."],
              ["몇 문항이며 얼마나 걸리나요?", "31문항이며, 평균 3분 이내에 완료할 수 있습니다."],
              ["결과를 다시 볼 수 있나요?", "카카오 로그인 후 마이페이지에 저장하면 언제든 다시 확인할 수 있습니다."],
            ] as [string, string][]).map(([q, a]) => (
              <div key={q} style={{ borderTop: "1px solid #e8e8e8", paddingTop: "1.25rem" }}>
                <dt style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#222222", marginBottom: "0.5rem" }}>Q. {q}</dt>
                <dd style={{ fontSize: "0.9375rem", color: "#555555", lineHeight: 1.7, margin: 0 }}>A. {a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#ffffff", padding: "32px clamp(16px, 4vw, 40px)" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", textAlign: "center" }}>
          <p className="footer-text" style={{ fontSize: "11px", color: "#aaaaaa", lineHeight: 2 }}>
            본 설문은 '이제마 동의수세보원(東醫壽世保元)' 을 기반으로 제작되었습니다.
          </p>
        </div>
      </footer>
      <Footer />
    </motion.div>
    </>
  );
}
