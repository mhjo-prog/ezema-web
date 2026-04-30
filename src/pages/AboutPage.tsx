import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";

function FadeUp({
  children,
  delay = 0,
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.72, delay, ease: [0.16, 1, 0.3, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function Divider() {
  return (
    <hr style={{ border: "none", borderTop: "1px solid #e8e8e8", margin: 0 }} />
  );
}

const VALUES = [
  {
    num: "01",
    title: "나를 아는 것이 건강의 시작",
    body: "체질이든 습관이든, 나를 이해하는 데서 건강이 시작됩니다.",
  },
  {
    num: "02",
    title: "이기적이지 않은 건강함",
    body: "나 뿐만 아니라, 소중한 사람의 안녕을 챙기는 문화를 만듭니다.",
  },
  {
    num: "03",
    title: "느리지만 꾸준하게",
    body: "빠른 결과보다 작은 습관이 쌓여 삶을 바꿉니다.",
  },
  {
    num: "04",
    title: "쉽고, 재미있게",
    body: "어려운 건강 정보를 카툰과 이야기로 누구나 이해할 수 있도록.",
  },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "'Pretendard', sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "clamp(140px, 20vw, 220px) clamp(16px, 5vw, 80px) clamp(80px, 10vw, 140px)",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#999",
            marginBottom: "32px",
          }}
        >
          About KeepSlow
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: "clamp(2rem, 6vw, 5rem)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#111",
            maxWidth: "900px",
          }}
        >
          Selfless Wellness
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: "clamp(2rem, 6vw, 5rem)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#111",
            maxWidth: "900px",
            marginTop: "8px",
          }}
        >
          이기적이지 않은 건강함
        </motion.p>
      </section>

      <Divider />

      {/* ── About ────────────────────────────────────────────────── */}
      <section
        className="about-what-we-do"
        style={{
          padding: "clamp(64px, 9vw, 112px) clamp(16px, 5vw, 80px)",
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "clamp(40px, 6vw, 100px)",
          alignItems: "start",
        }}
      >
        <FadeUp>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#999",
              marginBottom: "24px",
            }}
          >
            What We Do
          </p>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              color: "#111",
            }}
          >
            나의 건강 뿐만 아니라, 소중한 사람의 안녕을 챙기는 이기적이지 않은 건강 문화를 선도합니다.
          </h2>
        </FadeUp>

        <FadeUp delay={0.12}>
          <p
            style={{
              fontSize: "clamp(15px, 1.8vw, 17px)",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#999",
              marginBottom: "28px",
            }}
          >
            About KeepSlow
          </p>
          <p style={{ fontSize: "clamp(15px, 1.8vw, 17px)", color: "#555", lineHeight: 1.85, marginBottom: "36px" }}>
            우리는 넘쳐나는 정보와 선택 속에서 오히려 더 헷갈리는 시대에 살고 있습니다. 세상에는 이미 좋은 제품이 충분히 많습니다. 하지만 중요한 건 "모두에게 좋은 것"이 아니라 "나에게 맞는 것"입니다.
          </p>
          <p style={{ fontSize: "clamp(15px, 1.8vw, 17px)", color: "#555", lineHeight: 1.85 }}>
            KEEPSLOW는 나를 이해하는 것에서 시작하는 웰니스 브랜드입니다. 각자의 체질과 생활 방식, 상태는 모두 다릅니다. 우리는 그 차이를 이해하고, 나에게 맞는 건강과 선택을 찾을 수 있도록 돕고자 합니다.
          </p>
        </FadeUp>
      </section>

      <Divider />

      {/* ── Values ───────────────────────────────────────────────── */}
      <section
        style={{
          padding: "clamp(64px, 9vw, 112px) clamp(16px, 5vw, 80px)",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <FadeUp>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#999",
              marginBottom: "56px",
            }}
          >
            What Guides Us
          </p>
        </FadeUp>

        {VALUES.map((v, i) => (
          <div key={v.num}>
            <FadeUp delay={i * 0.06}>
              <div
                className="about-values-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 1fr",
                  gap: "24px",
                  padding: "36px 0",
                  alignItems: "start",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#bbb",
                    letterSpacing: "0.08em",
                    paddingTop: "4px",
                  }}
                >
                  {v.num}
                </span>
                <h3
                  style={{
                    fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
                    fontWeight: 700,
                    color: "#111",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.3,
                  }}
                >
                  {v.title}
                </h3>
                <p
                  style={{
                    fontSize: "clamp(14px, 1.6vw, 16px)",
                    color: "#666",
                    lineHeight: 1.8,
                  }}
                >
                  {v.body}
                </p>
              </div>
            </FadeUp>
            <Divider />
          </div>
        ))}
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section
        style={{
          background: "#111",
          padding: "clamp(80px, 12vw, 160px) clamp(16px, 5vw, 80px)",
          textAlign: "center",
        }}
      >
        <FadeUp>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#666",
              marginBottom: "32px",
            }}
          >
            Get Started
          </p>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#fff",
              marginBottom: "48px",
              maxWidth: "700px",
              margin: "0 auto 48px",
            }}
          >
            지금 바로 나에 대해 알아보세요.
          </h2>
          <div className="about-cta-buttons" style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/test")}
              style={{
                padding: "16px 40px",
                borderRadius: "50px",
                background: "#fff",
                color: "#111",
                fontSize: "0.9375rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.01em",
              }}
            >
              Body Type Test
            </button>
            <button
              onClick={() => navigate("/wellness")}
              style={{
                padding: "16px 40px",
                borderRadius: "50px",
                background: "none",
                color: "#fff",
                fontSize: "0.9375rem",
                fontWeight: 600,
                border: "1.5px solid #444",
                cursor: "pointer",
                letterSpacing: "0.01em",
              }}
            >
              Wellness Comics
            </button>
          </div>
        </FadeUp>
      </section>

      <style>{`
        div::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .about-what-we-do { grid-template-columns: 1fr !important; }
          .about-values-row { grid-template-columns: 40px 1fr !important; }
          .about-values-row > :last-child { grid-column: 2; }
        }
        @media (max-width: 480px) {
          .about-cta-buttons { flex-direction: column !important; align-items: center !important; }
          .about-cta-buttons button { width: 100% !important; max-width: 280px !important; }
        }
      `}</style>
    </div>
  );
}
