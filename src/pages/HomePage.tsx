import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseReady, type WellnessPost } from "../lib/supabase";

// ── Scroll-triggered fade-up wrapper ─────────────────────────────────
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

// ── Thin horizontal divider ───────────────────────────────────────────
function Divider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid #e8e8e8",
        margin: 0,
      }}
    />
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Pick<WellnessPost, "id" | "card_image_url">[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isSupabaseReady) return;
    supabase
      .from("wellness_posts")
      .select("id, card_image_url")
      .eq("status", "published")
      .not("card_image_url", "is", null)
      .limit(9)
      .then(({ data }) => {
        if (data) {
          setPosts(
            data.filter((p: Pick<WellnessPost, "id" | "card_image_url">) => p.card_image_url)
          );
        }
      });
  }, []);

  const wheelOffsetRef = useRef(0);
  const touchStartXRef = useRef(0);
  const touchOffsetAtStartRef = useRef(0);
  const [showArrow, setShowArrow] = useState(true);

  useEffect(() => {
    if (!posts.length) return;
    const container = sectionRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      const track = trackRef.current;
      if (!track) return;
      const maxTranslate = -(track.scrollWidth - container.clientWidth);
      const atStart = wheelOffsetRef.current >= 0 && e.deltaY < 0;
      const atEnd = wheelOffsetRef.current <= maxTranslate && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      e.stopPropagation();
      wheelOffsetRef.current = Math.max(maxTranslate, Math.min(0, wheelOffsetRef.current - e.deltaY * 2.5));
      track.style.transform = `translateX(${wheelOffsetRef.current}px)`;
      setShowArrow(wheelOffsetRef.current > maxTranslate + 8);
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [posts]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchOffsetAtStartRef.current = wheelOffsetRef.current;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const track = trackRef.current;
    const container = sectionRef.current;
    if (!track || !container) return;
    const dx = e.touches[0].clientX - touchStartXRef.current;
    const maxTranslate = -(track.scrollWidth - container.clientWidth);
    wheelOffsetRef.current = Math.max(maxTranslate, Math.min(0, touchOffsetAtStartRef.current + dx));
    track.style.transform = `translateX(${wheelOffsetRef.current}px)`;
    setShowArrow(wheelOffsetRef.current > maxTranslate + 8);
  };

  return (
    <div
      ref={pageRef}
      className="home-scroll"
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "'Pretendard', sans-serif",
      }}
    >
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section
        style={{
          background: "#feff8e",
        }}
      >
      <div className="hero-inner" style={{
          width: "100%",
          padding: "clamp(120px, 25vw, 232px) 24px 60px",
        }}>
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: "clamp(2rem, 6vw, 5rem)",
            fontWeight: 800,
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            color: "#111",
            marginBottom: "80px",
          }}
        >
          Selfless Wellness<br /><span style={{ fontSize: "0.88em" }}>이기적이지 않은 건강함</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <button
            className="hero-btn"
            onClick={() => navigate("/about")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "14px 28px",
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "0.01em",
              cursor: "pointer",
            }}
          >
            ABOUT US ↗
          </button>
        </motion.div>
      </div>
      </section>

      <Divider />

      {/* ── Open Positions ───────────────────────────────────────── */}
      <section
        className="journal-section"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "clamp(28px, 4vw, 48px) clamp(16px, 5vw, 80px)",
        }}
      >
        <FadeUp>
          <div className="journal-header">
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#999",
              marginBottom: "8px",
            }}
          >
            KEEPSLOW JOURNAL
          </p>
          <p
            className="journal-header-sub"
            style={{
              fontSize: "14px",
              color: "#aaa",
              marginBottom: "48px",
              letterSpacing: "0.01em",
            }}
          >
            나에게 맞는 콘텐츠를 찾아보세요
          </p>
          </div>
        </FadeUp>

        {[
          {
            title: "Wellness Comics",
            sub: "수면, 식단, 운동, 명상을 카툰으로",
            label: "Browse Comics",
            path: "/wellness",
          },
          {
            title: "Sasang Typology Stories",
            sub: "나의 체질을 이해하는 첫걸음",
            label: "Read Stories",
            path: "/sasang",
          },
          {
            title: "Sasang Body Type Test",
            sub: "지금 바로 체질 테스트하기",
            label: "Take the Test",
            path: "/test",
          },
        ].map((item, i) => (
          <div key={item.title}>
            <FadeUp delay={i * 0.06}>
              <div
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "nowrap",
                  gap: "12px",
                  padding: "28px 0",
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.opacity = "0.55";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.opacity = "1";
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "clamp(1rem, 3vw, 1.6rem)",
                      fontWeight: 700,
                      color: "#111",
                      letterSpacing: "-0.02em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.title}
                  </span>
                  <span style={{ fontSize: "clamp(13px, 1.8vw, 15px)", color: "#999", whiteSpace: "nowrap" }}>{item.sub}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: "clamp(11px, 1.5vw, 13px)",
                      color: "#999",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </span>
                  <span style={{ fontSize: "18px", color: "#ccc" }}>→</span>
                </div>
              </div>
            </FadeUp>
            <Divider />
          </div>
        ))}
      </section>

      <Divider />

      {/* ── Sasang Typology Section ──────────────────────────────── */}
      <section
        style={{
          background: "#f5f4f0",
          padding: "clamp(48px, 9vw, 112px) clamp(16px, 5vw, 80px)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "clamp(32px, 5vw, 64px)",
              alignItems: "center",
            }}
          >
            {/* Left: Text */}
            <FadeUp>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <p
                  style={{
                    fontSize: "clamp(11px, 1.5vw, 13px)",
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    color: "#999",
                  }}
                >
                  What is the Sasang body type test?
                </p>
                <h2
                  style={{
                    fontSize: "clamp(1.6rem, 4vw, 3rem)",
                    fontWeight: 700,
                    letterSpacing: "-0.035em",
                    lineHeight: 1.15,
                    color: "#111",
                  }}
                >
                  체질 검사를 하면<br />이런 결과를 받아요
                </h2>
                <p
                  style={{
                    fontSize: "clamp(14px, 1.8vw, 16px)",
                    color: "#666",
                    lineHeight: 1.8,
                  }}
                >
                  사상체질은 조선 말기 이제마가 창시한 한의학 이론으로, 사람을 태양인·소양인·태음인·소음인 4가지 유형으로 분류합니다. 체질별 장부 기능과 성정에 맞춰 건강과 섭생을 달리하는 맞춤 의학으로, 태음인이 약 40%로 가장 많습니다.
                </p>
                <div>
                  <button
                    className="hero-btn"
                    onClick={() => navigate("/test")}
                    style={{
                      padding: "14px 24px",
                      borderRadius: "50px",
                      background: "#111111",
                      color: "#ffffff",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                      border: "none",
                      cursor: "pointer",
                      width: "fit-content",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    }}
                  >
                    체질 검사하기
                  </button>
                </div>
              </div>
            </FadeUp>

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
                  background: "#ffffff",
                  borderRadius: "20px",
                  padding: "24px 22px",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                  transform: "rotate(2deg)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Badge */}
                <div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#111111", color: "#ffffff", fontWeight: 700, fontSize: "0.875rem", padding: "6px 14px", borderRadius: "50px" }}>
                    태음인
                    <span style={{ fontWeight: 400, fontSize: "0.7rem", opacity: 0.85 }}>太陰人</span>
                  </span>
                </div>

                {/* Keywords */}
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {["신중", "끈기", "목표지향"].map((kw) => (
                    <span key={kw} style={{ fontSize: "11px", fontWeight: 600, color: "#111111", background: "none", border: "1px solid #666", padding: "3px 9px", borderRadius: "50px" }}>
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
                    <polygon points="60,34 76,58 60,80 38,62" fill="rgba(0,0,0,0.08)" stroke="#111111" strokeWidth="1.8" strokeLinejoin="round" />
                    <circle cx="60" cy="34" r="3" fill="#111111" />
                    <circle cx="76" cy="58" r="3" fill="#111111" />
                    <circle cx="60" cy="80" r="3" fill="#111111" />
                    <circle cx="38" cy="62" r="3" fill="#111111" />
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
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Image Sticky Scroll (Supabase Wellness) ─────────────────── */}
      {posts.length > 0 && (
        <>
          <section
            ref={sectionRef}
            style={{ overflow: "hidden", padding: "24px 0", cursor: "default", position: "relative" }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            <div
              ref={trackRef}
              style={{
                display: "flex",
                gap: "16px",
                paddingLeft: "24px",
                paddingRight: "24px",
                willChange: "transform",
                transition: "transform 0.08s ease-out",
                userSelect: "none",
              }}
            >
              {posts.map((post, i) => (
                <div
                  key={post.id ?? i}
                  onClick={() => navigate(`/wellness/${post.id}`)}
                  style={{
                    width: "220px",
                    height: "220px",
                    flexShrink: 0,
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={post.card_image_url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* 우측 스크롤 힌트 오버레이 */}
            {showArrow && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: "64px",
                  background: "linear-gradient(to right, transparent, rgba(255,255,255,0.88))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: "10px",
                  pointerEvents: "none",
                }}
              >
                <span style={{ fontSize: "28px", fontWeight: 700, color: "rgba(0,0,0,0.28)", lineHeight: 1 }}>›</span>
              </div>
            )}
          </section>

          <Divider />
        </>
      )}

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "12px 40px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a
            href="https://www.instagram.com/keepslow_family/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", opacity: 0.5, transition: "opacity 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.5"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
                  <stop offset="0%" stopColor="#fdf497"/>
                  <stop offset="5%" stopColor="#fdf497"/>
                  <stop offset="45%" stopColor="#fd5949"/>
                  <stop offset="60%" stopColor="#d6249f"/>
                  <stop offset="90%" stopColor="#285AEB"/>
                </radialGradient>
              </defs>
              <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)"/>
              <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none"/>
              <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
            </svg>
          </a>
          <p style={{ fontSize: "12px", color: "#ccc", margin: 0 }}>
            © 2026 KeepSlow. All rights reserved.
          </p>
        </div>
        <p style={{ fontSize: "11px", color: "#ccc", margin: 0, textAlign: "center", lineHeight: 1.8 }}>
          BigBrown, 606-87-02388<br />
          10F, 437 Teheran-ro, Gangnam-gu, Seoul (Samyoung Building)
        </p>
      </footer>

      <style>{`
        @media (max-width: 480px) {
          .hero-inner { padding-top: 80px !important; padding-bottom: 28px !important; }
          .hero-title { margin-bottom: 52px !important; font-size: 1.5rem !important; }
          .hero-btn { padding: 10px 20px !important; font-size: 13px !important; width: fit-content !important; }
          .journal-section { padding-top: 24px !important; padding-bottom: 16px !important; }
          .journal-header { margin-top: 24px !important; }
          .journal-header-sub { margin-bottom: 20px !important; }
        }
      `}</style>
    </div>
  );
}
