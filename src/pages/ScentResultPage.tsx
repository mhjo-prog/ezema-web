import { useState, useEffect, useRef, Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseReady } from "../lib/supabase";
import { PENDING_SCENT_KEY } from "../context/AuthContext";
import { scentResults, SCENT_COLORS, SCENT_DISCLAIMER } from "../data/scentResults";
import { useAuth } from "../context/AuthContext";
import type { ScentType } from "../data/scentQuestions";
import type { RecommendOutput } from "../lib/recommend";
import type { AxisV2 } from "../data/surveyV2";
import type { Scent } from "../data/scents";
import { isProductionEnv } from "../lib/env";

// ─────────────────────────────────────────────────────────
// v2 저장은 마이그레이션 적용 전까지 비활성화
// ─────────────────────────────────────────────────────────
const V2_PERSIST_ENABLED = false;

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────
interface Props {
  recommendOutput: RecommendOutput;
  onRetry: () => void;
}

// ─────────────────────────────────────────────────────────
// Error boundary
// ─────────────────────────────────────────────────────────
class ResultErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
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
        <div
          style={{
            padding: "40px 24px",
            paddingTop: "80px",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            color: "#c00",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          <strong>결과 페이지 렌더 에러 (임시 디버그):</strong>
          {"\n\n"}
          {this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
const KAKAO_APP_KEY = "fbf533c6007cf5212883947fe851e02d";

/** AxisV2 → ScentType 캐스팅 (동일 문자열 유니온) */
function toScentType(axis: AxisV2 | "signature"): ScentType {
  if (axis === "signature") return "이완"; // fallback for display
  return axis as unknown as ScentType;
}

/** v2 축 원점수(3–12) → 케어 필요 퍼센트(0–100) */
function axisCarePct(raw: number): number {
  return Math.round(Math.max(0, Math.min(100, ((raw - 3) / 9) * 100)));
}

/** v2 축 원점수(3–12) → 건강 퍼센트(0–100, 레이더차트용) */
function axisHealthPct(raw: number): number {
  return Math.round(Math.max(0, Math.min(100, ((12 - raw) / 9) * 100)));
}

const AXIS_ORDER: AxisV2[] = ["이완", "숙면", "활력", "몰입", "청정"];

// ─────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────
function ScentToast({
  visible,
  message = "복사됐습니다 ✓",
}: {
  visible: boolean;
  message?: string;
}) {
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

// ─────────────────────────────────────────────────────────
// Share modal (v2: 링크는 테스트 재시작으로 단순화)
// ─────────────────────────────────────────────────────────
function ScentShareModal({
  scentType,
  onClose,
}: {
  scentType: ScentType;
  onClose: () => void;
}) {
  const shareUrl = `${window.location.origin}/scent-quiz`;
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
      buttons: [
        {
          title: "테스트 해보기",
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
      ],
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
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 500,
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#ffffff",
          borderRadius: "20px 20px 0 0",
          padding: "20px 24px 40px",
          zIndex: 501,
          maxWidth: "560px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "4px",
            background: "#e0e0e0",
            borderRadius: "2px",
            margin: "0 auto 24px",
          }}
        />
        <p
          className="font-bold"
          style={{
            fontSize: "1.1rem",
            color: "#111",
            textAlign: "center",
            marginBottom: "6px",
          }}
        >
          친구에게 공유하기
        </p>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#888",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          친구에게 테스트 링크를 보내보세요
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <motion.button
            onClick={handleKakao}
            whileTap={{ scale: 0.98 }}
            className="font-semibold"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              width: "100%",
              padding: "16px",
              borderRadius: "14px",
              background: "#FEE500",
              border: "none",
              color: "#3C1E1E",
              fontSize: "0.975rem",
              cursor: "pointer",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3C6.477 3 2 6.477 2 10.909c0 2.756 1.528 5.19 3.878 6.702l-.99 3.697 4.27-2.817A11.64 11.64 0 0012 18.818c5.523 0 10-3.476 10-7.909C22 6.477 17.523 3 12 3z"
                fill="#3C1E1E"
              />
            </svg>
            카카오톡으로 보내기
          </motion.button>
          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.98 }}
            className="font-semibold"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              width: "100%",
              padding: "16px",
              borderRadius: "14px",
              background: "#f5f5f5",
              border: "1.5px solid #e5e5e5",
              color: "#333333",
              fontSize: "0.975rem",
              cursor: "pointer",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            링크 복사하기
          </motion.button>
        </div>
      </motion.div>
      <ScentToast visible={showToast} />
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Save modal (v2: V2_PERSIST_ENABLED=false 이므로 실제 저장 안 함)
// ─────────────────────────────────────────────────────────
function ScentSaveModal({
  scentType,
  onClose,
}: {
  scentType: ScentType;
  onClose: () => void;
}) {
  const { user, loginWithKakao, isLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!V2_PERSIST_ENABLED) {
      // 마이그레이션 전 — 저장 기능 비활성화
      onClose();
      return;
    }
    if (user) {
      setSaving(true);
      setSaveError(null);
      if (isSupabaseReady && isProductionEnv) {
        const { error } = await supabase.from("scent_results").insert({
          kakao_id: user.kakao_id,
          scent_type: scentType,
          // v2 컬럼 추가 후 여기에 item_scores, axis_scores 등 추가 예정
        });
        if (error) {
          console.error("[scent_results v2] insert 오류:", error);
          setSaving(false);
          setSaveError("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
          return;
        }
      }
      setSaving(false);
      onClose();
    } else {
      localStorage.setItem(
        PENDING_SCENT_KEY,
        JSON.stringify({ scentType, scores: {}, facetScores: {} })
      );
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
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 500,
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#ffffff",
          borderRadius: "20px 20px 0 0",
          padding: "20px 24px 40px",
          zIndex: 501,
          maxWidth: "560px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "4px",
            background: "#e0e0e0",
            borderRadius: "2px",
            margin: "0 auto 24px",
          }}
        />
        <p
          className="font-bold"
          style={{
            fontSize: "1.15rem",
            color: "#111",
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          결과를 저장할게요
        </p>
        {saveError && (
          <p
            style={{
              fontSize: "0.8rem",
              color: "#e03131",
              textAlign: "center",
              marginBottom: "12px",
              background: "#fff5f5",
              padding: "10px 14px",
              borderRadius: "8px",
            }}
          >
            {saveError}
          </p>
        )}
        <ul
          style={{
            fontSize: "0.875rem",
            color: "#888",
            marginBottom: "28px",
            lineHeight: 1.7,
            listStyle: "none",
            padding: 0,
            textAlign: "center",
          }}
        >
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
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            width: "100%",
            padding: "16px",
            borderRadius: "14px",
            background: "#FEE500",
            border: "none",
            color: "#3C1E1E",
            fontSize: "0.975rem",
            cursor: "pointer",
            opacity: saving || isLoading ? 0.7 : 1,
          }}
        >
          {!user && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3C6.477 3 2 6.477 2 10.909c0 2.756 1.528 5.19 3.878 6.702l-.99 3.697 4.27-2.817A11.64 11.64 0 0012 18.818c5.523 0 10-3.476 10-7.909C22 6.477 17.523 3 12 3z"
                fill="#3C1E1E"
              />
            </svg>
          )}
          {saving
            ? "저장 중..."
            : isLoading
            ? "로그인 중..."
            : user
            ? "마이페이지에 저장하기"
            : "카카오로 저장하기(로그인)"}
        </motion.button>
        <button
          onClick={onClose}
          style={{
            display: "block",
            width: "100%",
            marginTop: "20px",
            background: "none",
            border: "none",
            fontSize: "0.85rem",
            color: "#aaa",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          나중에 할게요
        </button>
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// SectionLabel
// ─────────────────────────────────────────────────────────
function SectionLabel({
  children,
  color,
}: {
  children: string;
  color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ height: "1px", flex: 1, background: "#eeeeee" }} />
      <span
        style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color,
          flexShrink: 0,
        }}
      >
        {children}
      </span>
      <div style={{ height: "1px", flex: 1, background: "#eeeeee" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// RadarChart — 5 축 (v2: 건강 점수 기반)
// ─────────────────────────────────────────────────────────
interface RadarAxis {
  label: string;
  value: number;
  displayValue: number;
}

function ScentRadarChart({
  axes: axisData,
  color,
}: {
  axes: RadarAxis[];
  color: string;
}) {
  const SIZE = 240;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = 80;
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const axisAngleDeg = (i: number) => -90 + (360 / axisData.length) * i;
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
    const lx = cx + (r + 28) * cos;
    const ly = cy + (r + 28) * sin;
    const textAnchor = (
      cos > 0.15 ? "start" : cos < -0.15 ? "end" : "middle"
    ) as "start" | "end" | "middle";
    const dominantBaseline = (
      sin < -0.15 ? "auto" : sin > 0.15 ? "hanging" : "middle"
    ) as "auto" | "hanging" | "middle";
    return { lx, ly, textAnchor, dominantBaseline };
  };
  const gridPolygon = (level: number) =>
    axisData
      .map((_, i) => {
        const p = axisPoint(i, level * 100);
        return `${p.x},${p.y}`;
      })
      .join(" ");
  const dataPolygon = axisData
    .map(({ displayValue }, i) => {
      const p = axisPoint(i, displayValue);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <motion.div
      style={{
        background: "#ffffff",
        border: "1px solid #eeeeee",
        borderRadius: "16px",
        padding: "1.5rem",
        marginBottom: "0.75rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <SectionLabel color={color}>Radar Chart</SectionLabel>
      <p
        style={{
          fontSize: "11px",
          color: "#aaaaaa",
          textAlign: "center",
          marginTop: "8px",
          lineHeight: 1.5,
        }}
      >
        바깥으로 채워질수록 안정적인 영역, 중심에 가까울수록 케어가 필요한
        영역이에요
      </p>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ display: "block", margin: "16px auto 0", overflow: "visible" }}
      >
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={gridPolygon(level)}
            fill="none"
            stroke="#eeeeee"
            strokeWidth="1"
          />
        ))}
        {axisData.map((_, i) => {
          const p = axisPoint(i, 100);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="#e0e0e0"
              strokeWidth="1"
            />
          );
        })}
        <motion.g
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <polygon
            points={dataPolygon}
            fill={`${color}22`}
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
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

// ─────────────────────────────────────────────────────────
// BarGauge — v2: 케어 필요도 표시 (높을수록 케어 필요)
// ─────────────────────────────────────────────────────────
function BarGauge({
  axisRaw,
  primaryAxis,
}: {
  axisRaw: Record<AxisV2, number>;
  primaryAxis: AxisV2 | "signature";
}) {
  const sorted = AXIS_ORDER.map((axis) => ({
    axis,
    score: axisCarePct(axisRaw[axis] ?? 3),
  })).sort((a, b) => b.score - a.score); // 높을수록 케어 필요 → 첫 번째

  const [widths, setWidths] = useState<number[]>(
    Array(AXIS_ORDER.length).fill(0)
  );

  useEffect(() => {
    const id = setTimeout(() => {
      setWidths(sorted.map(({ score }) => score));
    }, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const primaryType = toScentType(primaryAxis);
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginTop: "20px",
        }}
      >
        {sorted.map(({ axis, score }, i) => {
          const color =
            SCENT_COLORS[axis as unknown as ScentType] ?? primaryColor;
          const isPrimary = axis === primaryAxis;
          return (
            <div key={axis}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: isPrimary ? color : "#888888",
                  }}
                >
                  {axis}
                </span>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: isPrimary ? color : "#aaaaaa",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {score}점
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "#f0f0f0",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
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

// ─────────────────────────────────────────────────────────
// ScentCard — v2: ScentResult({ scent, reason })
// ─────────────────────────────────────────────────────────
const NOTE_LABEL: Record<"top" | "middle" | "base", string> = {
  top: "탑노트",
  middle: "미들노트",
  base: "베이스노트",
};

function ScentCard({
  result,
  color,
  index,
  isPrimary = false,
}: {
  result: { scent: Scent; reason: string };
  color: string;
  index: number;
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
      {/* Reason bar */}
      <div
        style={{
          padding: isPrimary ? "9px 18px" : "8px 18px",
          borderBottom: isPrimary
            ? `1px solid ${color}33`
            : "1px solid #ebebeb",
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
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              background: "rgba(255,255,255,0.22)",
              color: "#ffffff",
              padding: "2px 7px",
              borderRadius: "50px",
              letterSpacing: "0.05em",
              flexShrink: 0,
            }}
          >
            BEST
          </span>
        )}
        {reason}
      </div>

      {/* Main row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          padding: "14px 18px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "3px",
            }}
          >
            <p
              style={{ fontSize: "0.97rem", fontWeight: 700, color: "#111111" }}
            >
              {scent.nameKo}
            </p>
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
          <p
            style={{
              fontSize: "0.75rem",
              color: "#aaaaaa",
              fontStyle: "italic",
              marginBottom: "8px",
            }}
          >
            {scent.nameEn}
          </p>
          <div style={{ marginBottom: "6px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#999999",
                letterSpacing: "0.04em",
              }}
            >
              핵심 성분
            </span>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#555555",
                lineHeight: 1.5,
                marginTop: "2px",
              }}
            >
              {scent.keyCompound}
            </p>
          </div>
          <div style={{ marginBottom: "6px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#999999",
                letterSpacing: "0.04em",
              }}
            >
              작용 방식
            </span>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#555555",
                lineHeight: 1.5,
                marginTop: "2px",
              }}
            >
              {scent.mechanism}
            </p>
          </div>
          <p style={{ fontSize: "0.78rem", color: color, fontWeight: 500 }}>
            사용법: {scent.usage}
          </p>
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
          <p
            style={{
              fontSize: "12px",
              color: "#666666",
              lineHeight: 1.6,
              marginBottom: "8px",
            }}
          >
            {scent.evidence}
          </p>
          <a
            href={scent.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              color: "#888888",
              textDecoration: "underline",
            }}
          >
            (논문보기) {scent.sourceTitle}
          </a>
        </div>
      </motion.div>

      {/* Caution */}
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

// ─────────────────────────────────────────────────────────
// Inner page
// ─────────────────────────────────────────────────────────
function ScentResultPageInner({ recommendOutput, onRetry }: Props) {
  const { primaryAxis, scents: displayScents, axisRaw, tieBreakReason, appliedFilters } =
    recommendOutput;

  const scentType = toScentType(primaryAxis);
  const themeColor = SCENT_COLORS[scentType];
  const result = scentResults[scentType];

  const { user } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const hasSavedRef = useRef(false);

  // v2 저장 비활성화 (V2_PERSIST_ENABLED = false)
  useEffect(() => {
    if (!V2_PERSIST_ENABLED) return;
    if (!user || hasSavedRef.current) return;
    hasSavedRef.current = true;
    if (!isSupabaseReady || !isProductionEnv) return;
    // 마이그레이션 적용 후 item_scores 포함 저장 예정
    // supabase.from("recommendations").insert({ ... })
  }, [user]);

  // Radar: 5축 건강 점수 (높을수록 안정적 → 레이더 바깥으로)
  const radarAxes: RadarAxis[] = AXIS_ORDER.map((axis) => {
    const health = axisHealthPct(axisRaw[axis] ?? 6);
    return {
      label: axis,
      value: health,
      displayValue: 20 + (health / 100) * 80,
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
      <div
        style={{
          height: "3px",
          background: `linear-gradient(90deg, ${themeColor}, ${themeColor}99)`,
        }}
      />

      {/* ── Hero ── */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #eeeeee" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "560px",
            margin: "0 auto",
            padding:
              "clamp(3rem, 6vw, 5rem) 1.5rem clamp(1.5rem, 3vw, 2.5rem)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <motion.div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "2.5rem",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div
              style={{ height: "1px", width: "32px", background: themeColor }}
            />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: themeColor,
              }}
            >
              Your Scent Result
            </span>
            <div
              style={{ height: "1px", width: "32px", background: themeColor }}
            />
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
            {primaryAxis === "signature" ? "시그니처" : result.type}케어
          </motion.h1>

          <motion.div
            style={{
              width: "48px",
              height: "3px",
              background: themeColor,
              borderRadius: "2px",
              marginBottom: "0.75rem",
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.38, duration: 0.5 }}
          />

          <motion.p
            style={{
              fontSize: "1.05rem",
              fontWeight: 600,
              color: "#333333",
              marginBottom: "1rem",
            }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {primaryAxis === "signature"
              ? "전반적으로 컨디션이 좋아요"
              : result.subtitle}
          </motion.p>

          <motion.div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
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
            style={{
              fontSize: "0.975rem",
              color: "#666666",
              lineHeight: 1.85,
              maxWidth: "480px",
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            {primaryAxis === "signature"
              ? "모든 축이 안정적이에요. 선호하는 향으로 일상에 향기를 더해보세요."
              : result.description.split("\n").map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
          </motion.p>

          {/* 동점 처리 안내 */}
          {tieBreakReason && (
            <motion.p
              style={{
                marginTop: "12px",
                fontSize: "0.8rem",
                color: "#aaa",
                fontStyle: "italic",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {tieBreakReason}
            </motion.p>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          margin: "0 auto",
          padding: "1.5rem 1.5rem 20px",
        }}
      >
        {/* BarGauge + RadarChart */}
        <BarGauge axisRaw={axisRaw} primaryAxis={primaryAxis} />
        <ScentRadarChart axes={radarAxes} color={themeColor} />

        {/* 적용된 필터 안내 */}
        {appliedFilters.length > 0 && (
          <motion.div
            style={{
              background: "#f0f7ff",
              border: "1px solid #cce0ff",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "0.75rem",
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {appliedFilters.map((f, i) => (
              <p
                key={i}
                style={{
                  fontSize: "0.8rem",
                  color: "#3366aa",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                • {f.description}
              </p>
            ))}
          </motion.div>
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
          <p
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: themeColor,
              marginTop: "20px",
              marginBottom: "10px",
              letterSpacing: "0.04em",
            }}
          >
            추천 향 ·{" "}
            {primaryAxis === "signature" ? "시그니처" : result.type}케어
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {displayScents.map((r, i) => (
              <ScentCard
                key={r.scent.id}
                result={r}
                color={themeColor}
                index={i}
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
          <p
            style={{
              fontSize: "0.78rem",
              color: "#999999",
              lineHeight: 1.75,
              textAlign: "center",
              whiteSpace: "pre-line",
            }}
          >
            ⚠ {SCENT_DISCLAIMER}
          </p>
        </motion.div>

        {/* 저장 / 공유 버튼 */}
        <motion.div
          style={{ display: "flex", gap: "8px", marginBottom: "0.75rem" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          <motion.button
            onClick={() => setShowSaveModal(true)}
            whileTap={{ scale: 0.99 }}
            className="font-semibold"
            style={{
              flex: 1,
              padding: "17px",
              borderRadius: "50px",
              background: themeColor,
              border: `1.5px solid ${themeColor}`,
              color: "#ffffff",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            결과 저장하기
          </motion.button>
          <motion.button
            onClick={() => setShowShareModal(true)}
            whileTap={{ scale: 0.99 }}
            className="font-semibold"
            style={{
              flex: 1,
              padding: "17px",
              borderRadius: "50px",
              background: "#ffffff",
              border: "1.5px solid #dddddd",
              color: "#666666",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            친구에게 공유하기
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {showShareModal && (
            <ScentShareModal
              scentType={scentType}
              onClose={() => setShowShareModal(false)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showSaveModal && (
            <ScentSaveModal
              scentType={scentType}
              onClose={() => setShowSaveModal(false)}
            />
          )}
        </AnimatePresence>

        {/* 다시 검사하기 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05, duration: 0.5 }}
        >
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

        <p
          style={{
            fontSize: "11px",
            color: "#aaaaaa",
            lineHeight: 1.8,
            textAlign: "center",
            marginTop: "20px",
            paddingBottom: "24px",
          }}
        >
          © 2026 KeepSlow. All rights reserved.
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────
export default function ScentResultPage(props: Props) {
  return (
    <ResultErrorBoundary>
      <ScentResultPageInner {...props} />
    </ResultErrorBoundary>
  );
}
