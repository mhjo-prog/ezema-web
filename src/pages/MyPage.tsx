import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const CONSTITUTION_LABELS: Record<string, string> = {
  태양인: "태양인 (太陽人)",
  태음인: "태음인 (太陰人)",
  소양인: "소양인 (少陽人)",
  소음인: "소음인 (少陰人)",
};

const CONSTITUTION_DESC: Record<string, string> = {
  태양인: "창의적이고 사교적인 기질을 가진 체질입니다.",
  태음인: "인내심이 강하고 꾸준한 기질을 가진 체질입니다.",
  소양인: "열정적이고 활동적인 기질을 가진 체질입니다.",
  소음인: "섬세하고 내향적인 기질을 가진 체질입니다.",
};

interface QuizResult {
  constitutionType: string;
  scores: Record<string, number>;
}

export default function MyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    try {
      const raw = localStorage.getItem("ezema_mypage_result");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.constitutionType) setQuizResult(parsed);
      }
    } catch {
      // ignore
    }
  }, [user, navigate]);

  if (!user) return null;

  const scoreEntries = quizResult
    ? Object.entries(quizResult.scores).sort(([, a], [, b]) => b - a)
    : [];
  const maxScore = scoreEntries.length > 0 ? scoreEntries[0][1] : 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        paddingTop: "56px",
        fontFamily: "'Pretendard', sans-serif",
      }}
    >
      {/* 히어로 스트립 */}
      <div style={{ background: "#feff8e", borderBottom: "1px solid #e8e8e8" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 24px 32px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#999999", marginBottom: "6px" }}>
            KEEPSLOW
          </p>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, color: "#000000", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            Mypage
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* ── 프로필 섹션 ── */}
        <section style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#999999", marginBottom: "20px" }}>
            PROFILE
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", padding: "28px", border: "1px solid #e8e8e8", borderRadius: "16px" }}>
            {user.profile_image ? (
              <img
                src={user.profile_image}
                alt={user.nickname}
                style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid #e8e8e8" }}
              />
            ) : (
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#f5f5f5", border: "1px solid #e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, color: "#000000", flexShrink: 0 }}>
                {user.nickname.charAt(0)}
              </div>
            )}
            <div>
              <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "#000000", letterSpacing: "-0.02em" }}>
                {user.nickname}
              </p>
              {user.email && (
                <p style={{ fontSize: "0.875rem", color: "#999999", marginTop: "4px" }}>{user.email}</p>
              )}
              <p style={{ fontSize: "0.75rem", color: "#bbbbbb", marginTop: "6px", letterSpacing: "0.02em" }}>
                카카오 로그인
              </p>
            </div>
          </div>
        </section>

        <div style={{ height: "1px", background: "#e8e8e8", marginBottom: "48px" }} />

        {/* ── 나의 체질 진단 결과 ── */}
        <section style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#999999", marginBottom: "20px" }}>
            CONSTITUTION TYPE
          </p>

          {quizResult ? (
            <div style={{ padding: "28px", border: "1px solid #e8e8e8", borderRadius: "16px" }}>
              <div style={{ marginBottom: "24px" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999999", marginBottom: "8px" }}>
                  진단 결과
                </p>
                <p style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, color: "#000000", letterSpacing: "-0.03em", marginBottom: "8px" }}>
                  {CONSTITUTION_LABELS[quizResult.constitutionType] ?? quizResult.constitutionType}
                </p>
                <p style={{ fontSize: "0.9rem", color: "#666666", lineHeight: 1.6 }}>
                  {CONSTITUTION_DESC[quizResult.constitutionType]}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {scoreEntries.map(([type, score]) => {
                  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
                  const isTop = type === quizResult.constitutionType;
                  return (
                    <div key={type}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: isTop ? 700 : 500, color: isTop ? "#000000" : "#666666" }}>
                          {type}
                        </span>
                        <span style={{ fontSize: "0.8125rem", fontWeight: isTop ? 700 : 400, color: isTop ? "#000000" : "#999999" }}>
                          {score}점
                        </span>
                      </div>
                      <div style={{ height: "4px", background: "#f0f0f0", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: isTop ? "#000000" : "#cccccc", borderRadius: "2px" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f0f0f0", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={() => navigate("/sasang")}
                  style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#ffffff", background: "#000000", border: "none", padding: "9px 20px", borderRadius: "50px", cursor: "pointer", letterSpacing: "0.01em" }}
                >
                  관련 아티클 보기
                </button>
                <button
                  onClick={() => navigate("/test")}
                  style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#666666", border: "1px solid #e8e8e8", padding: "9px 20px", borderRadius: "50px", cursor: "pointer", background: "transparent", letterSpacing: "0.01em" }}
                >
                  다시 진단하기
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "48px 28px", border: "1px solid #e8e8e8", borderRadius: "16px", background: "#f5f5f5", textAlign: "center" }}>
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "#333333", marginBottom: "8px" }}>
                아직 체질 진단을 하지 않으셨어요.
              </p>
              <p style={{ fontSize: "0.875rem", color: "#999999", marginBottom: "24px" }}>
                체질 테스트를 통해 나의 사상체질을 알아보세요.
              </p>
              <button
                onClick={() => navigate("/test")}
                style={{ padding: "12px 28px", background: "#000000", color: "#ffffff", fontWeight: 600, fontSize: "0.9rem", borderRadius: "50px", cursor: "pointer", border: "none", letterSpacing: "0.01em" }}
              >
                체질 진단하러 가기
              </button>
            </div>
          )}
        </section>

        <div style={{ height: "1px", background: "#e8e8e8", marginBottom: "48px" }} />

        {/* ── 저장한 콘텐츠 ── */}
        <section style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#999999", marginBottom: "20px" }}>
            SAVED CONTENT
          </p>
          <div style={{ padding: "48px 28px", border: "1px solid #e8e8e8", borderRadius: "16px", background: "#f5f5f5", textAlign: "center" }}>
            <p style={{ fontSize: "1rem", fontWeight: 600, color: "#333333", marginBottom: "8px" }}>
              저장한 콘텐츠가 없습니다.
            </p>
            <p style={{ fontSize: "0.875rem", color: "#999999", marginBottom: "24px" }}>
              아티클을 읽고 저장하면 여기에 표시됩니다.
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/sasang")}
                style={{ padding: "10px 22px", background: "#000000", color: "#ffffff", fontWeight: 600, fontSize: "0.875rem", borderRadius: "50px", cursor: "pointer", border: "none", letterSpacing: "0.01em" }}
              >
                사상체질 이야기
              </button>
              <button
                onClick={() => navigate("/wellness")}
                style={{ padding: "10px 22px", background: "transparent", color: "#000000", fontWeight: 600, fontSize: "0.875rem", borderRadius: "50px", cursor: "pointer", border: "1px solid #e8e8e8", letterSpacing: "0.01em" }}
              >
                Wellness
              </button>
            </div>
          </div>
        </section>

        <div style={{ height: "1px", background: "#e8e8e8", marginBottom: "48px" }} />

        {/* ── 계정 / 로그아웃 ── */}
        <section>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#999999", marginBottom: "20px" }}>
            ACCOUNT
          </p>
          <button
            onClick={() => { logout(); navigate("/"); }}
            style={{ padding: "12px 28px", background: "transparent", color: "#000000", fontWeight: 600, fontSize: "0.9rem", borderRadius: "50px", cursor: "pointer", border: "1px solid #000000", letterSpacing: "0.01em" }}
          >
            로그아웃
          </button>
        </section>
      </div>
    </motion.div>
  );
}
