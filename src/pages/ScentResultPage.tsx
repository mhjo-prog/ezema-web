import { useState, useEffect, useRef, Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseReady } from "../lib/supabase";
import { PENDING_SCENT_KEY } from "../context/AuthContext";

class ResultErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message + "\n" + error.stack };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ScentResultPage] render error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "40px 24px", paddingTop: "80px", fontFamily: "monospace", whiteSpace: "pre-wrap", color: "#c00", fontSize: "13px", lineHeight: 1.6 }}>
          <strong>결과 페이지 렌더 에러 (임시 디버그):</strong>{"\n\n"}{this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}
import { scentResults, SCENT_COLORS, SCENT_DISCLAIMER } from "../data/scentResults";
import { useAuth } from "../context/AuthContext";
import type { ScentType } from "../data/scentQuestions";
import { matchScentPerFacet, computeFacetScores } from "../lib/scentMatch";
import type { MatchResult } from "../lib/scentMatch";

interface Props {
  scentType: ScentType;
  scores: Record<string, number>;
  facetScores: Record<string, number>;
  onRetry: () => void;
}

const KAKAO_APP_KEY = "fbf533c6007cf5212883947fe851e02d";
import { isProductionEnv } from "../lib/env";

function ScentToast({ visible, message = "복사됐습니다 ✓" }: { visible: boolean; message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16 }}
      transition={{ duration: 0.22 }}
      style={{
        position: "fixed",
        bottom: "88px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.78)",
        color: "#ffffff",
        padding: "11px 24px",
        borderRadius: "50px",
        fontSize: "0.9rem",
        fontWeight: 600,
        pointerEvents: "none",
        zIndex: 600,
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </motion.div>
  );
}

const AXIS_ORDER: ScentType[] = ["이완", "숙면", "활력", "몰입", "청정"];
const FACET_ORDER = [
  "onset","maintain","morning","rhythm",
  "emotional","physical","autonomic","recovery",
  "afternoon","wakeup","fatigue","caffeine",
  "duration","distract","switch","screen",
  "airway","sensitive","stuffy","hygiene",
];

function buildShareUrl(scentType: ScentType, scores: Record<string, number>, facetScores: Record<string, number>): string {
  const as = AXIS_ORDER.map(t => Math.round(scores[t] ?? 0)).join(",");
  const fs = FACET_ORDER.map(f => Math.round(facetScores[f] ?? 1)).join(",");
  return `${window.location.origin}/scent-quiz?scentType=${encodeURIComponent(scentType)}&as=${as}&fs=${fs}`;
}

function ScentShareModal({ scentType, scores, facetScores, onClose }: { scentType: ScentType; scores: Record<string, number>; facetScores: Record<string, number>; onClose: () => void }) {
  const shareUrl = buildShareUrl(scentType, scores, facetScores);
  const [showToast, setShowToast] = useState(false);

  const handleKakao = () => {
    if (!window.Kakao) return;
    if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_APP_KEY);
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: "KeepSlow - 향 체질 테스트",
        description: `나의 향 유형은 '${scentType}케어'예요. 당신의 향은?`,
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [{ title: "결과 보기", link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 1800);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 500 }}
      />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#ffffff", borderRadius: "20px 20px 0 0",
          padding: "20px 24px 40px", zIndex: 501,
          maxWidth: "560px", margin: "0 auto",
        }}
      >
        <div style={{ width: "40px", height: "4px", background: "#e0e0e0", borderRadius: "2px", margin: "0 auto 24px" }} />
        <p className="font-bold" style={{ fontSize: "1.1rem", color: "#111", textAlign: "center", marginBottom: "6px" }}>친구에게 공유하기</p>
        <p style={{ fontSize: "0.875rem", color: "#888", textAlign: "center", marginBottom: "24px" }}>결과 링크를 친구에게 공유해보세요</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <motion.button
            onClick={handleKakao}
            whileTap={{ scale: 0.98 }}
            className="font-semibold"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", padding: "16px", borderRadius: "14px", background: "#FEE500", border: "none", color: "#3C1E1E", fontSize: "0.975rem", cursor: "pointer" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C6.477 3 2 6.477 2 10.909c0 2.756 1.528 5.19 3.878 6.702l-.99 3.697 4.27-2.817A11.64 11.64 0 0012 18.818c5.523 0 10-3.476 10-7.909C22 6.477 17.523 3 12 3z" fill="#3C1E1E"/>
            </svg>
            카카오톡으로 보내기
          </motion.button>
          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.98 }}
            className="font-semibold"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", padding: "16px", borderRadius: "14px", background: "#f5f5f5", border: "1.5px solid #e5e5e5", color: "#333333", fontSize: "0.975rem", cursor: "pointer" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
            링크 복사하기
          </motion.button>
        </div>
      </motion.div>
      <ScentToast visible={showToast} />
    </>
  );
}

function ScentSaveModal({ scentType, scores, facetScores, onClose }: { scentType: ScentType; scores: Record<string, number>; facetScores: Record<string, number>; onClose: () => void }) {
  const { user, loginWithKakao, isLoading } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (user) {
      setSaving(true);
      setSaveError(null);
      if (isSupabaseReady && isProductionEnv) {
        const { error } = await supabase
          .from("scent_results")
          .insert({ kakao_id: user.kakao_id, scent_type: scentType, scores, facet_scores: facetScores });
        if (error) {
          console.error("[scent_results] insert 오류:", error);
          setSaving(false);
          setSaveError("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
          return;
        }
      }
      setSaving(false);
      onClose();
      navigate("/mypage");
    } else {
      localStorage.setItem(PENDING_SCENT_KEY, JSON.stringify({ scentType, scores, facetScores }));
      loginWithKakao();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 500 }}
      />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#ffffff", borderRadius: "20px 20px 0 0",
          padding: "20px 24px 40px", zIndex: 501,
          maxWidth: "560px", margin: "0 auto",
        }}
      >
        <div style={{ width: "40px", height: "4px", background: "#e0e0e0", borderRadius: "2px", margin: "0 auto 24px" }} />
        <p className="font-bold" style={{ fontSize: "1.15rem", color: "#111", textAlign: "center", marginBottom: "8px" }}>결과를 저장할게요</p>
        {saveError && (
          <p style={{ fontSize: "0.8rem", color: "#e03131", textAlign: "center", marginBottom: "12px", background: "#fff5f5", padding: "10px 14px", borderRadius: "8px" }}>
            {saveError}
          </p>
        )}
        <ul style={{ fontSize: "0.875rem", color: "#888", marginBottom: "28px", lineHeight: 1.7, listStyle: "none", padding: 0, textAlign: "center" }}>
          {user ? (
            <li>마이페이지에 향 체질 결과를 기록해드릴게요</li>
          ) : (
            <>
              <li>로그인하면 내 향 결과를 언제든 확인할 수 있어요</li>
              <li>마이페이지에서 나만의 콘텐츠를 저장해보세요</li>
            </>
          )}
        </ul>
        <motion.button
          onClick={handleSave}
          disabled={saving || isLoading}
          whileTap={{ scale: 0.98 }}
          className="font-semibold"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", padding: "16px", borderRadius: "14px", background: "#FEE500", border: "none", color: "#3C1E1E", fontSize: "0.975rem", cursor: "pointer", opacity: (saving || isLoading) ? 0.7 : 1 }}
        >
          {!user && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C6.477 3 2 6.477 2 10.909c0 2.756 1.528 5.19 3.878 6.702l-.99 3.697 4.27-2.817A11.64 11.64 0 0012 18.818c5.523 0 10-3.476 10-7.909C22 6.477 17.523 3 12 3z" fill="#3C1E1E"/>
            </svg>
          )}
          {saving ? "저장 중..." : isLoading ? "로그인 중..." : user ? "마이페이지에 저장하기" : "카카오로 저장하기(로그인)"}
        </motion.button>
        <button
          onClick={onClose}
          style={{ display: "block", width: "100%", marginTop: "20px", background: "none", border: "none", fontSize: "0.85rem", color: "#aaa", cursor: "pointer", textAlign: "center" }}
        >
          나중에 할게요
        </button>
      </motion.div>
    </>
  );
}

function scentDisplayScore(scores: Record<string, number>, type: ScentType): number {
  const raw = scores[type] || 0; // 4~16, 높을수록 건강함
  const MIN = 4;
  const MAX = 16;
  return Math.round(Math.max(0, Math.min(100, ((raw - MIN) / (MAX - MIN)) * 100)));
}

function SectionLabel({ children, color }: { children: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "0" }}>
      <div style={{ height: "1px", flex: 1, background: "#eeeeee" }} />
      <span
        style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color, flexShrink: 0 }}
      >
        {children}
      </span>
      <div style={{ height: "1px", flex: 1, background: "#eeeeee" }} />
    </div>
  );
}

interface RadarAxis {
  label: string;
  value: number;        // 0~100 (원본 정규화값, 텍스트 표시용)
  displayValue: number; // 20~100 (좌표 계산용, 0점이 중심에 붙지 않도록 재매핑)
}

function ScentRadarChart({ axes: axisData, color }: { axes: RadarAxis[]; color: string }) {
  const SIZE = 240;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = 80;
  const numAxes = axisData.length;
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const axisAngleDeg = (i: number) => -90 + (360 / numAxes) * i;

  const axisPoint = (i: number, value: number) => {
    const angle = axisAngleDeg(i) * (Math.PI / 180);
    return {
      x: cx + (value / 100) * r * Math.cos(angle),
      y: cy + (value / 100) * r * Math.sin(angle),
    };
  };

  const getLabelProps = (i: number) => {
    const angleDeg = axisAngleDeg(i);
    const rad = angleDeg * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    // label position: r + 28px in the axis direction
    const lx = cx + (r + 28) * cos;
    const ly = cy + (r + 28) * sin;
    const textAnchor = (cos > 0.15 ? "start" : cos < -0.15 ? "end" : "middle") as "start" | "end" | "middle";
    const dominantBaseline = (sin < -0.15 ? "auto" : sin > 0.15 ? "hanging" : "middle") as "auto" | "hanging" | "middle";
    return { lx, ly, textAnchor, dominantBaseline };
  };

  const gridPolygon = (level: number) =>
    axisData.map((_, i) => {
      const p = axisPoint(i, level * 100);
      return `${p.x},${p.y}`;
    }).join(" ");

  const dataPolygon = axisData.map(({ displayValue }, i) => {
    const p = axisPoint(i, displayValue);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <motion.div
      style={{
        background: "#ffffff",
        border: "1px solid #eeeeee",
        borderRadius: "16px",
        padding: "1.5rem 1.5rem",
        marginBottom: "0.75rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <SectionLabel color={color}>Radar Chart</SectionLabel>
      <p style={{ fontSize: "11px", color: "#aaaaaa", textAlign: "center", marginTop: "8px", lineHeight: 1.5 }}>
        바깥으로 채워질수록 안정적인 영역, 중심에 가까울수록 케어가 필요한 영역이에요
      </p>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ display: "block", margin: "16px auto 0", overflow: "visible" }}
      >
        {gridLevels.map((level) => (
          <polygon key={level} points={gridPolygon(level)} fill="none" stroke="#eeeeee" strokeWidth="1" />
        ))}
        {axisData.map((_, i) => {
          const p = axisPoint(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e0e0e0" strokeWidth="1" />;
        })}
        <motion.g
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <polygon points={dataPolygon} fill={`${color}22`} stroke={color} strokeWidth="2" strokeLinejoin="round" />
          {axisData.map(({ label, displayValue }, i) => {
            const p = axisPoint(i, displayValue);
            return <circle key={label} cx={p.x} cy={p.y} r="4" fill={color} />;
          })}
        </motion.g>
        {axisData.map(({ label }, i) => {
          const { lx, ly, textAnchor, dominantBaseline } = getLabelProps(i);
          return (
            <text
              key={label}
              x={lx}
              y={ly}
              textAnchor={textAnchor}
              dominantBaseline={dominantBaseline}
              fontSize="12"
              fontWeight="700"
              fill="#555"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </motion.div>
  );
}

function BarGauge({ scores, primaryType }: { scores: Record<string, number>; primaryType: ScentType }) {
  const sorted = Object.keys(scores)
    .map((type) => ({
      type: type as ScentType,
      score: scentDisplayScore(scores, type as ScentType),
    }))
    .sort((a, b) => a.score - b.score);

  const [widths, setWidths] = useState<number[]>(Array(Object.keys(scores).length).fill(0));

  useEffect(() => {
    const id = setTimeout(() => {
      setWidths(sorted.map(({ score }) => score));
    }, 600);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const primaryColor = SCENT_COLORS[primaryType];

  return (
    <motion.div
      style={{
        background: "#ffffff",
        border: "1px solid #eeeeee",
        borderRadius: "16px",
        padding: "1.5rem 2rem",
        marginBottom: "0.75rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.5 }}
    >
      <SectionLabel color={primaryColor}>Score</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "20px" }}>
        {sorted.map(({ type, score }, i) => {
          const color = SCENT_COLORS[type];
          const isPrimary = i === 0;
          return (
            <div key={type}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: isPrimary ? color : "#888888" }}>
                  {type}
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: isPrimary ? color : "#aaaaaa", fontVariantNumeric: "tabular-nums" }}>
                  {score}점
                </span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "#f0f0f0", borderRadius: "999px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${widths[i] ?? 0}%`,
                    borderRadius: "999px",
                    background: isPrimary ? color : `${color}66`,
                    transition: `width 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.15}s`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

const NOTE_LABEL: Record<"top" | "middle" | "base", string> = {
  top: "탑노트",
  middle: "미들노트",
  base: "베이스노트",
};

function ScentCard({ result, color, index, showReason = true, isPrimary = false }: {
  result: MatchResult;
  color: string;
  index: number;
  showReason?: boolean;
  isPrimary?: boolean;
}) {
  const { scent, reason } = result;
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) setContentHeight(contentRef.current.scrollHeight);
  }, [open]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.75 + index * 0.08, duration: 0.4 }}
      style={{
        borderRadius: "12px",
        border: isPrimary ? `1.5px solid ${color}` : "1px solid #e5e5e5",
        background: "#ffffff",
        overflow: "hidden",
        boxShadow: isPrimary ? `0 4px 16px ${color}22` : "none",
      }}
    >
      {/* 추천 사유 바 */}
      {showReason && (
        <div
          style={{
            padding: isPrimary ? "9px 18px" : "8px 18px",
            borderBottom: isPrimary ? `1px solid ${color}33` : "1px solid #ebebeb",
            background: isPrimary ? color : "#f4f4f4",
            fontSize: isPrimary ? "12px" : "11px",
            color: isPrimary ? "#ffffff" : "#666666",
            fontWeight: 600,
            letterSpacing: "0.01em",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {isPrimary && (
            <span style={{
              fontSize: "10px",
              fontWeight: 700,
              background: "rgba(255,255,255,0.22)",
              color: "#ffffff",
              padding: "2px 7px",
              borderRadius: "50px",
              letterSpacing: "0.05em",
              flexShrink: 0,
            }}>
              BEST
            </span>
          )}
          {reason}
        </div>
      )}

      {/* Main row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 18px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 이름 + 노트 배지 */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
            <p style={{ fontSize: "0.97rem", fontWeight: 700, color: "#111111" }}>{scent.nameKo}</p>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: "50px",
                background: `${color}18`,
                color: color,
                letterSpacing: "0.03em",
              }}
            >
              {NOTE_LABEL[scent.note]}
            </span>
          </div>
          {/* 학명 */}
          <p style={{ fontSize: "0.75rem", color: "#aaaaaa", fontStyle: "italic", marginBottom: "8px" }}>
            {scent.nameEn}
          </p>
          {/* 핵심 성분 */}
          <div style={{ marginBottom: "6px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#999999", letterSpacing: "0.04em" }}>핵심 성분</span>
            <p style={{ fontSize: "0.8rem", color: "#555555", lineHeight: 1.5, marginTop: "2px" }}>{scent.keyCompound}</p>
          </div>
          {/* 작용 방식 */}
          <div style={{ marginBottom: "6px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#999999", letterSpacing: "0.04em" }}>작용 방식</span>
            <p style={{ fontSize: "0.8rem", color: "#555555", lineHeight: 1.5, marginTop: "2px" }}>{scent.mechanism}</p>
          </div>
          {/* 사용법 */}
          <p style={{ fontSize: "0.78rem", color: color, fontWeight: 500 }}>사용법: {scent.usage}</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            flexShrink: 0,
            fontSize: "11px",
            fontWeight: 600,
            color: color,
            background: `${color}14`,
            border: `1px solid ${color}33`,
            borderRadius: "50px",
            padding: "4px 10px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            marginTop: "2px",
          }}
        >
          {open ? "닫기" : "근거"}
        </button>
      </div>

      {/* Accordion: evidence */}
      <motion.div
        initial={false}
        animate={{ height: open ? contentHeight : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        <div
          ref={contentRef}
          style={{
            padding: "12px 18px 14px",
            borderTop: "1px solid #eeeeee",
            background: `${color}08`,
          }}
        >
          <p style={{ fontSize: "12px", color: "#666666", lineHeight: 1.6, marginBottom: "8px" }}>
            {scent.evidence}
          </p>
          <a
            href={scent.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#888888", textDecoration: "underline" }}
          >
            (논문보기) {scent.sourceTitle}
          </a>
        </div>
      </motion.div>

      {/* 주의사항 */}
      {scent.caution && (
        <div
          style={{
            padding: "8px 18px",
            borderTop: "1px solid #f0f0f0",
            fontSize: "11px",
            color: "#bb8800",
            background: "#fffbee",
            lineHeight: 1.5,
          }}
        >
          ⚠ {scent.caution}
        </div>
      )}
    </motion.div>
  );
}

function ScentResultPageInner({ scentType, scores, facetScores, onRetry }: Props) {
  const result = scentResults[scentType];
  const themeColor = SCENT_COLORS[scentType];
  const { user } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // 중복 저장 방지 (팝업 로그인 시 user 변경으로 useEffect 재실행되어도 한 번만 저장)
  const hasSavedRef = useRef(false);

  // URL에 as, fs 파라미터가 있으면 공유 링크 열람 → 자동 저장 스킵
  const isSharedView = new URLSearchParams(window.location.search).has("as");

  // 로그인 상태이고 공유 링크가 아닐 때 자동 저장
  // [user] 의존성: 비로그인 상태로 마운트 → 팝업 로그인 후 user 세팅되면 재실행되어 저장
  useEffect(() => {
    if (isSharedView || !user) return;
    if (!scentType || Object.keys(scores).length === 0 || Object.keys(facetScores).length === 0) return;
    if (hasSavedRef.current) return; // 이미 저장했으면 스킵
    hasSavedRef.current = true;

    // 로컬/개발 환경: 저장 스킵 (버튼은 렌더링 조건에서 별도 분기로 처리)
    if (!isSupabaseReady || !isProductionEnv) return;

    setAutoSaveStatus("saving");
    supabase
      .from("scent_results")
      .insert({ kakao_id: user.kakao_id, scent_type: scentType, scores, facet_scores: facetScores })
      .then(({ error }) => {
        if (error) {
          console.error("[scent_results] 자동 저장 오류:", JSON.stringify({
            message: error.message,
            code: (error as any).code,
            details: (error as any).details,
            hint: (error as any).hint,
          }));
          hasSavedRef.current = false; // 실패 시 재시도 허용
          setAutoSaveStatus("error");
        } else {
          setAutoSaveStatus("saved");
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRetryAutoSave = async () => {
    if (!user || !isSupabaseReady) return;
    hasSavedRef.current = true;
    setAutoSaveStatus("saving");
    const { error } = await supabase
      .from("scent_results")
      .insert({ kakao_id: user.kakao_id, scent_type: scentType, scores, facet_scores: facetScores });
    if (error) {
      console.error("[scent_results] 재저장 오류:", JSON.stringify({
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
      }));
      hasSavedRef.current = false;
      setAutoSaveStatus("error");
    } else {
      setAutoSaveStatus("saved");
    }
  };

  // facet 기반 매칭 (5개 축 전부 동일 방식)
  const normalizedFacetScores = computeFacetScores(facetScores);

  const FACET_SHORT_LABELS: Record<string, string> = {
    // 숙면
    onset:     "입면",
    maintain:  "깊은 수면",
    morning:   "개운한 아침",
    rhythm:    "수면 리듬",
    // 이완
    physical:  "근육 이완",
    emotional: "감정 안정",
    autonomic: "심신 안정",
    recovery:  "완전한 이완",
    // 활력
    afternoon: "오후 에너지",
    wakeup:    "가벼운 기상",
    fatigue:   "몸의 가벼움",
    caffeine:  "카페인 프리",
    // 몰입
    duration:  "집중 지속",
    distract:  "흐름 유지",
    switch:    "한 가지 몰입",
    screen:    "화면 휴식",
    // 청정
    airway:    "편한 호흡",
    sensitive: "먼지 저항력",
    stuffy:    "쾌적한 공기",
    hygiene:   "환기 습관",
  };

  const AXIS_FACET_KEYS: Record<ScentType, string[]> = {
    이완: ["physical", "emotional", "autonomic", "recovery"],
    숙면: ["onset", "maintain", "morning", "rhythm"],
    활력: ["afternoon", "wakeup", "fatigue", "caffeine"],
    몰입: ["duration", "distract", "switch", "screen"],
    청정: ["airway", "sensitive", "stuffy", "hygiene"],
  };
  const facetAxisKeys = AXIS_FACET_KEYS[scentType];

  const displayScents: MatchResult[] = matchScentPerFacet(normalizedFacetScores, scentType);
  const radarAxes: RadarAxis[] = facetAxisKeys.map((f) => {
    const normalized = normalizedFacetScores[f as keyof typeof normalizedFacetScores] ?? 0;
    return {
      label: FACET_SHORT_LABELS[f],
      value: normalized,
      // 0점이 중심에 붙지 않도록 첫 번째 링(20)을 최솟값으로 재매핑
      // 공식: displayValue = 20 + (normalized / 100) * 80
      // 결과: 0→20, 33.33→46.67, 66.67→73.33, 100→100
      displayValue: 20 + (normalized / 100) * 80,
    };
  });

  if (!result) return null;

  return (
    <motion.div
      style={{ paddingTop: "56px", background: "#f8f8f8" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top accent bar */}
      <div style={{ height: "3px", background: `linear-gradient(90deg, ${themeColor}, ${themeColor}99)` }} />

      {/* ── Hero ── */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #eeeeee" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "560px",
            margin: "0 auto",
            padding: "clamp(3rem, 6vw, 5rem) 1.5rem clamp(1.5rem, 3vw, 2.5rem)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <motion.div
            style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "2.5rem" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div style={{ height: "1px", width: "32px", background: themeColor }} />
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: themeColor }}>
              Your Scent Result
            </span>
            <div style={{ height: "1px", width: "32px", background: themeColor }} />
          </motion.div>

          <motion.h1
            className="font-extrabold"
            style={{
              fontSize: "clamp(3.5rem, 8vw, 4.5rem)",
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: "#111111",
              marginBottom: "1rem",
            }}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            {result.type}케어
          </motion.h1>

          <motion.div
            style={{ width: "48px", height: "3px", background: themeColor, borderRadius: "2px", marginBottom: "0.75rem" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.38, duration: 0.5 }}
          />

          <motion.p
            style={{ fontSize: "1.05rem", fontWeight: 600, color: "#333333", marginBottom: "1rem" }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {result.subtitle}
          </motion.p>

          <motion.div
            style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "1.5rem" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.5 }}
          >
            {result.traits.map((trait) => (
              <span
                key={trait}
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  padding: "4px 12px",
                  borderRadius: "50px",
                  background: `${themeColor}14`,
                  color: themeColor,
                  border: `1px solid ${themeColor}33`,
                }}
              >
                {trait}
              </span>
            ))}
          </motion.div>

          <motion.p
            style={{ fontSize: "0.975rem", color: "#666666", lineHeight: 1.85, maxWidth: "480px" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            {result.description.split("\n").map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </motion.p>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto", padding: "1.5rem 1.5rem 20px" }}>

        {/* 전체 공통: BarGauge → RadarChart 순 */}
        {scores && Object.keys(scores).length > 0 && (
          <>
            <BarGauge scores={scores} primaryType={scentType} />
            <ScentRadarChart axes={radarAxes} color={themeColor} />
          </>
        )}

        {/* 추천 향 카드 */}
        <motion.div
          style={{
            background: "#ffffff",
            border: "1px solid #eeeeee",
            borderRadius: "16px",
            padding: "1.5rem 2rem",
            marginBottom: "0.75rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
        >
          <SectionLabel color={themeColor}>Recommended Scents</SectionLabel>

          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: themeColor, marginTop: "20px", marginBottom: "10px", letterSpacing: "0.04em" }}>
            추천 향 · {result.type}케어
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {displayScents.map((r, i) => (
              <ScentCard
                key={r.scent.id}
                result={r}
                color={themeColor}
                index={i}
                showReason={true}
                isPrimary={i === 0}
              />
            ))}
          </div>
        </motion.div>

        {/* 주의 문구 */}
        <motion.div
          style={{
            background: "#ffffff",
            border: "1px solid #eeeeee",
            borderRadius: "16px",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.25rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <p style={{ fontSize: "0.78rem", color: "#999999", lineHeight: 1.75, textAlign: "center", whiteSpace: "pre-line" }}>
            ⚠ {SCENT_DISCLAIMER}
          </p>
        </motion.div>

        {/* 결과 저장 / 공유 버튼 */}
        <motion.div
          style={{ display: "flex", gap: "8px", marginBottom: "0.75rem" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          {user && !isSharedView && isProductionEnv ? (
            /* 로그인 상태 + 프로덕션: 자동 저장 상태에 따라 표시 */
            autoSaveStatus === "saved" ? (
              <div
                className="font-semibold"
                style={{ flex: 1, padding: "17px", borderRadius: "50px", background: "#f0f0f0", border: "1.5px solid #e0e0e0", color: "#888888", fontSize: "0.95rem", textAlign: "center" }}
              >
                저장 완료되었습니다 ✓
              </div>
            ) : autoSaveStatus === "error" ? (
              <motion.button
                onClick={handleRetryAutoSave}
                whileTap={{ scale: 0.99 }}
                className="font-semibold"
                style={{ flex: 1, padding: "17px", borderRadius: "50px", background: "#fff0f0", border: "1.5px solid #ffcccc", color: "#cc3333", fontSize: "0.95rem", cursor: "pointer" }}
              >
                다시 저장하기
              </motion.button>
            ) : (
              <div
                className="font-semibold"
                style={{ flex: 1, padding: "17px", borderRadius: "50px", background: "#f0f0f0", border: "1.5px solid #e0e0e0", color: "#aaaaaa", fontSize: "0.95rem", textAlign: "center" }}
              >
                저장 중...
              </div>
            )
          ) : (
            /* 비로그인 / 공유 링크 / 로컬 환경: 저장하기 버튼 */
            <motion.button
              onClick={() => setShowSaveModal(true)}
              whileTap={{ scale: 0.99 }}
              className="font-semibold"
              style={{ flex: 1, padding: "17px", borderRadius: "50px", background: themeColor, border: `1.5px solid ${themeColor}`, color: "#ffffff", fontSize: "0.95rem", cursor: "pointer" }}
            >
              결과 저장하기
            </motion.button>
          )}
          <motion.button
            onClick={() => setShowShareModal(true)}
            whileTap={{ scale: 0.99 }}
            className="font-semibold"
            style={{
              flex: 1, padding: "17px", borderRadius: "50px",
              background: "#ffffff", border: "1.5px solid #dddddd",
              color: "#666666", fontSize: "0.95rem", cursor: "pointer",
            }}
          >
            친구에게 공유하기
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {showShareModal && (
            <ScentShareModal scentType={scentType} scores={scores} facetScores={facetScores} onClose={() => setShowShareModal(false)} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showSaveModal && (
            <ScentSaveModal scentType={scentType} scores={scores} facetScores={facetScores} onClose={() => setShowSaveModal(false)} />
          )}
        </AnimatePresence>

        {/* 다시 검사하기 */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.05, duration: 0.5 }}>
          <motion.button
            onClick={onRetry}
            whileTap={{ scale: 0.99 }}
            style={{
              width: "100%",
              padding: "17px",
              borderRadius: "50px",
              background: "#ffffff",
              border: "1.5px solid #dddddd",
              color: "#666666",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            다시 검사하기
          </motion.button>
        </motion.div>

        <p style={{ fontSize: "11px", color: "#aaaaaa", lineHeight: 1.8, textAlign: "center", marginTop: "20px", paddingBottom: "24px" }}>
          © 2026 KeepSlow. All rights reserved.
        </p>
      </div>
    </motion.div>
  );
}

export default function ScentResultPage(props: Props) {
  return (
    <ResultErrorBoundary>
      <ScentResultPageInner {...props} />
    </ResultErrorBoundary>
  );
}
