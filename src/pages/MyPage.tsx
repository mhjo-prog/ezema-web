import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const CONSTITUTION_COLORS: Record<string, string> = {
  태음인: "#1E8A4C",
  소음인: "#6B3FA0",
  태양인: "#E8460A",
  소양인: "#0774C4",
};

interface QuizResult {
  constitutionType: string;
  scores: Record<string, number>;
}

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const pct = (type: string) => (total > 0 ? ((scores[type] || 0) / total) * 100 : 0);

  const 태양 = pct("태양인");
  const 소양 = pct("소양인");
  const 태음 = pct("태음인");
  const 소음 = pct("소음인");

  const 태 = 태양 + 태음;
  const 소 = 소양 + 소음;
  const 양 = 태양 + 소양;
  const 음 = 태음 + 소음;

  const SIZE = 180;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = 62;

  const topY    = cy - (태 / 100) * r;
  const rightX  = cx + (양 / 100) * r;
  const bottomY = cy + (소 / 100) * r;
  const leftX   = cx - (음 / 100) * r;

  const polygon = `${cx},${topY} ${rightX},${cy} ${cx},${bottomY} ${leftX},${cy}`;
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display: "block", margin: "0 auto" }}>
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={`${cx},${cy - r * level} ${cx + r * level},${cy} ${cx},${cy + r * level} ${cx - r * level},${cy}`}
          fill="none" stroke="#eeeeee" strokeWidth="1"
        />
      ))}
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#e0e0e0" strokeWidth="1" />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#e0e0e0" strokeWidth="1" />

      <polygon
        points={polygon}
        fill="rgba(7,116,196,0.10)"
        stroke="#0774C4"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx={cx}      cy={topY}    r="4" fill="#0774C4" />
      <circle cx={rightX}  cy={cy}      r="4" fill="#0774C4" />
      <circle cx={cx}      cy={bottomY} r="4" fill="#0774C4" />
      <circle cx={leftX}   cy={cy}      r="4" fill="#0774C4" />

      <text x={cx}          y={cy - r - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="#555">태</text>
      <text x={cx + r + 14} y={cy + 4}      textAnchor="start"  fontSize="11" fontWeight="700" fill="#555">양</text>
      <text x={cx}          y={cy + r + 18} textAnchor="middle" fontSize="11" fontWeight="700" fill="#555">소</text>
      <text x={cx - r - 14} y={cy + 4}      textAnchor="end"    fontSize="11" fontWeight="700" fill="#555">음</text>
    </svg>
  );
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
    const saved = localStorage.getItem("ezema_mypage_result");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.constitutionType) setQuizResult(parsed);
      } catch {
        // ignore
      }
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return null;

  const color = quizResult ? (CONSTITUTION_COLORS[quizResult.constitutionType] ?? "#0774C4") : "#0774C4";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: "100vh", background: "#f8f8f8", paddingTop: "56px" }}
    >
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* 프로필 */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          {user.profile_image ? (
            <img
              src={user.profile_image}
              alt={user.nickname}
              style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px", display: "block", border: "2px solid #eeeeee" }}
            />
          ) : (
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "#FEE500", margin: "0 auto 12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem", fontWeight: 700, color: "#3C1E1E",
            }}>
              {user.nickname.charAt(0)}
            </div>
          )}
          <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111111", marginBottom: "4px" }}>{user.nickname}</p>
          {user.email && (
            <p style={{ fontSize: "0.8125rem", color: "#aaaaaa" }}>{user.email}</p>
          )}
        </div>

        {/* 내 체질 섹션 */}
        <div style={{
          background: "#ffffff", borderRadius: "16px",
          border: "1px solid #eeeeee", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          padding: "28px 24px", marginBottom: "12px",
        }}>
          {/* 섹션 라벨 */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ height: "1px", flex: 1, background: "#eeeeee" }} />
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.28em", color: "#111111", textTransform: "uppercase", flexShrink: 0 }}>
              My Body Type
            </span>
            <div style={{ height: "1px", flex: 1, background: "#eeeeee" }} />
          </div>

          {quizResult ? (
            <>
              <RadarChart scores={quizResult.scores} />
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <span style={{
                  fontSize: "0.75rem", fontWeight: 700, color, background: `${color}14`,
                  padding: "4px 12px", borderRadius: "20px", letterSpacing: "0.03em",
                }}>
                  {quizResult.constitutionType}
                </span>
                <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111111", marginTop: "10px" }}>
                  {quizResult.constitutionType}
                </p>
              </div>
              <button
                onClick={() => navigate("/quiz")}
                style={{
                  display: "block", width: "100%", marginTop: "20px",
                  padding: "11px", borderRadius: "50px",
                  background: "none", border: "1.5px solid #dddddd",
                  fontSize: "0.875rem", fontWeight: 600, color: "#666666", cursor: "pointer",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#111"; e.currentTarget.style.color = "#111"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#dddddd"; e.currentTarget.style.color = "#666666"; }}
              >
                다시 테스트하기
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ fontSize: "2rem", marginBottom: "12px" }}>🌿</p>
              <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#333333", marginBottom: "6px" }}>
                아직 테스트를 하지 않았어요
              </p>
              <p style={{ fontSize: "0.8125rem", color: "#aaaaaa", marginBottom: "20px" }}>
                나의 사상체질을 알아보세요
              </p>
              <button
                onClick={() => navigate("/test")}
                style={{
                  padding: "12px 28px", borderRadius: "50px",
                  background: "#111111", border: "none",
                  fontSize: "0.875rem", fontWeight: 600, color: "#ffffff", cursor: "pointer",
                }}
              >
                테스트하기
              </button>
            </div>
          )}
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          style={{
            display: "block", width: "100%", padding: "14px",
            borderRadius: "12px", background: "#ffffff",
            border: "1px solid #eeeeee", fontSize: "0.875rem",
            fontWeight: 500, color: "#888888", cursor: "pointer",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#e53e3e"; e.currentTarget.style.borderColor = "#fecaca"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#888888"; e.currentTarget.style.borderColor = "#eeeeee"; }}
        >
          로그아웃
        </button>
      </div>
    </motion.div>
  );
}
