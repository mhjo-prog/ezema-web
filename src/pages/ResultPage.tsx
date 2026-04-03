import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { results } from "../data/results";
import { supabase, isSupabaseReady } from "../lib/supabase";

declare global {
  interface Window {
    Kakao: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

const KAKAO_APP_KEY = "24eafa4d5cd9751908400f9de2e7f954";

interface Props {
  constitutionType: string;
  scores: Record<string, number>;
  onRetry: () => void;
  isShared?: boolean;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-0">
      <div className="h-px flex-1" style={{ background: "#eeeeee" }} />
      <span
        className="font-semibold uppercase flex-shrink-0"
        style={{ fontSize: "10px", letterSpacing: "0.28em", color: "#0774C4" }}
      >
        {children}
      </span>
      <div className="h-px flex-1" style={{ background: "#eeeeee" }} />
    </div>
  );
}


function ScoreGauge({ scores }: { scores: Record<string, number> }) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const pct = (type: string) => (total > 0 ? ((scores[type] || 0) / total) * 100 : 0);

  const 태양 = pct("태양인");
  const 소양 = pct("소양인");
  const 태음 = pct("태음인");
  const 소음 = pct("소음인");

  const 태 = 태양 + 태음; // top
  const 소 = 소양 + 소음; // bottom
  const 양 = 태양 + 소양; // right
  const 음 = 태음 + 소음; // left

  const SIZE = 220;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = 75;

  const topY    = cy - (태 / 100) * r;
  const rightX  = cx + (양 / 100) * r;
  const bottomY = cy + (소 / 100) * r;
  const leftX   = cx - (음 / 100) * r;

  const polygon = `${cx},${topY} ${rightX},${cy} ${cx},${bottomY} ${leftX},${cy}`;
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

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
      <SectionLabel>Radar Chart</SectionLabel>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ display: "block", margin: "12px auto 0" }}
      >
        {/* 격자 마름모 */}
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={`${cx},${cy - r * level} ${cx + r * level},${cy} ${cx},${cy + r * level} ${cx - r * level},${cy}`}
            fill="none"
            stroke="#eeeeee"
            strokeWidth="1"
          />
        ))}
        {/* 축 선 */}
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#e0e0e0" strokeWidth="1" />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#e0e0e0" strokeWidth="1" />

        {/* 데이터 폴리곤 (scale 애니메이션) */}
        <motion.g
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
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
        </motion.g>

        {/* 축 라벨 */}
        <text x={cx}        y={cy - r - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#555">태</text>
        <text x={cx + r + 16} y={cy + 5}   textAnchor="start"  fontSize="12" fontWeight="700" fill="#555">양</text>
        <text x={cx}        y={cy + r + 20} textAnchor="middle" fontSize="12" fontWeight="700" fill="#555">소</text>
        <text x={cx - r - 16} y={cy + 5}   textAnchor="end"    fontSize="12" fontWeight="700" fill="#555">음</text>

        {/* 퍼센트 값 라벨 */}
        <motion.text x={cx} y={topY - 9} textAnchor="middle" fontSize="10" fontWeight="600" fill="#0774C4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.3 }}>
          {Math.round(태)}%
        </motion.text>
        <motion.text x={rightX + 7} y={cy - 6} textAnchor="start" fontSize="10" fontWeight="600" fill="#0774C4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.3 }}>
          {Math.round(양)}%
        </motion.text>
        <motion.text x={cx} y={bottomY + 17} textAnchor="middle" fontSize="10" fontWeight="600" fill="#0774C4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.3 }}>
          {Math.round(소)}%
        </motion.text>
        <motion.text x={leftX - 7} y={cy - 6} textAnchor="end" fontSize="10" fontWeight="600" fill="#0774C4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.3 }}>
          {Math.round(음)}%
        </motion.text>
      </svg>
    </motion.div>
  );
}

const constitutionColors: Record<string, string> = {
  태양인: "#9333ea",
  소양인: "#0ea5e9",
  태음인: "#22c55e",
  소음인: "#f97316",
};

function BarGauge({ scores }: { scores: Record<string, number> }) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(scores)
    .map(([type, score]) => ({
      type,
      score,
      pct: total > 0 ? Math.round((score / total) * 100) : 0,
    }))
    .sort((a, b) => b.score - a.score);

  const [widths, setWidths] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    const id = setTimeout(() => {
      setWidths(sorted.map(({ pct }) => pct));
    }, 600);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      transition={{ delay: 0.65, duration: 0.5 }}
    >
      <SectionLabel>Score</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "20px" }}>
        {sorted.map(({ type, pct }, i) => (
          <div key={type}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: i === 0 ? constitutionColors[type] : "#888888" }}>
                {type}
              </span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: i === 0 ? constitutionColors[type] : "#aaaaaa", fontVariantNumeric: "tabular-nums" }}>
                {pct}%
              </span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "#f0f0f0", borderRadius: "999px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${widths[i] ?? 0}%`,
                  borderRadius: "999px",
                  background: i === 0 ? constitutionColors[type] : `${constitutionColors[type]}66`,
                  transition: `width 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.15}s`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

const organDetails: Record<string, { label: string; desc: string }> = {
  폐: { label: "폐 (肺)", desc: "호흡과 기혈 순환을 주관합니다." },
  간: { label: "간 (肝)", desc: "해독과 혈액 저장을 담당합니다." },
  췌장: { label: "췌장 (膵)", desc: "소화 흡수와 면역 기능을 담당합니다." },
  신장: { label: "신장 (腎)", desc: "수분 균형과 생명력을 조절합니다." },
};

const constitutionOrgans: Record<string, { strong: string; weak: string }> = {
  태양인: { strong: "폐", weak: "간" },
  소양인: { strong: "췌장", weak: "신장" },
  태음인: { strong: "간", weak: "폐" },
  소음인: { strong: "신장", weak: "췌장" },
};


function OrganIllustration({ constitutionType }: { constitutionType: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const organs = constitutionOrgans[constitutionType];
  if (!organs) return null;
  const { strong, weak } = organs;

  const getHighlightColor = (organ: string) => organ === strong ? "#3b82f6" : organ === weak ? "#e53e3e" : "#888888";

  const getFillOpacity = (organ: string) => {
    if (organ === selected) return 0.55;
    if (organ === hovered) return 0.25;
    return 0;
  };
  const getStroke = (organ: string) =>
    organ === selected || organ === hovered ? getHighlightColor(organ) : "none";

  const handleClick = (name: string) =>
    setSelected(prev => prev === name ? null : name);

  const hov = (name: string) => ({
    onMouseEnter: () => setHovered(name),
    onMouseLeave: () => setHovered(null),
    onClick: () => handleClick(name),
    style: { cursor: "pointer" },
  });

  // Tooltip anchor: center-top of each organ
  const tooltipAnchor: Record<string, [number, number]> = {
    폐:   [100, 22],
    간:   [76,  108],
    췌장: [116, 162],
    신장: [95,  162],
  };

  const renderTooltip = (organ: string) => {
    const label = organDetails[organ].label;
    const [ax, ay] = tooltipAnchor[organ];
    const hPad = 10;
    const tw = hPad * 2 + Math.ceil(label.length * 6.2);
    const th = 26;
    const tx = Math.max(2, Math.min(ax - tw / 2, 198 - tw));
    const ty = ay - th - 4;
    return (
      <g key={organ} style={{ pointerEvents: "none" }}>
        <rect x={tx} y={ty} width={tw} height={th} rx="7" fill="rgba(15,15,20,0.82)" />
        <text x={tx + tw / 2} y={ty + 17} textAnchor="middle" fontSize="8.5" fill="#fff" fontWeight="700"
          style={{ fontFamily: "system-ui, sans-serif" }}>
          {label}
        </text>
      </g>
    );
  };

  const displayOrgan = hovered ?? selected;

  return (
    <motion.div
      style={{
        background: "#ffffff",
        border: "1px solid #eeeeee",
        borderRadius: "16px",
        padding: "2rem",
        marginBottom: "0.75rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65, duration: 0.5 }}
    >
      <SectionLabel>Organs</SectionLabel>

      <div style={{ marginTop: "20px" }}>
        <svg
          viewBox="0 0 200 267"
          style={{ width: "100%", maxWidth: "260px", margin: "0 auto", display: "block", overflow: "visible" }}
        >
          <image href="/organs2.png" x="0" y="0" width="200" height="267" preserveAspectRatio="xMidYMid slice" />

          {/* ── Lungs (폐) ── */}
          <g {...hov("폐")}>
            <ellipse cx="56" cy="82" rx="40" ry="54"
              fill={getHighlightColor("폐")} fillOpacity={getFillOpacity("폐")}
              stroke={getStroke("폐")} strokeWidth="1.5"
            />
            <ellipse cx="152" cy="62" rx="38" ry="44"
              fill={getHighlightColor("폐")} fillOpacity={getFillOpacity("폐")}
              stroke={getStroke("폐")} strokeWidth="1.5"
            />
          </g>

          {/* ── Liver (간) ── */}
          <g {...hov("간")}>
            <ellipse cx="76" cy="140" rx="58" ry="28"
              fill={getHighlightColor("간")} fillOpacity={getFillOpacity("간")}
              stroke={getStroke("간")} strokeWidth="1.5"
            />
          </g>

          {/* ── Pancreas (췌장) ── */}
          <g {...hov("췌장")}>
            <ellipse cx="116" cy="183" rx="32" ry="16"
              fill={getHighlightColor("췌장")} fillOpacity={getFillOpacity("췌장")}
              stroke={getStroke("췌장")} strokeWidth="1.5"
            />
          </g>

          {/* ── Kidneys (신장) ── */}
          <g {...hov("신장")}>
            <ellipse cx="51" cy="192" rx="18" ry="24"
              fill={getHighlightColor("신장")} fillOpacity={getFillOpacity("신장")}
              stroke={getStroke("신장")} strokeWidth="1.5"
            />
            <ellipse cx="152" cy="186" rx="16" ry="22"
              fill={getHighlightColor("신장")} fillOpacity={getFillOpacity("신장")}
              stroke={getStroke("신장")} strokeWidth="1.5"
            />
          </g>

          {/* ── SVG Tooltip ── */}
          {hovered && renderTooltip(hovered)}
          {!hovered && selected && renderTooltip(selected)}
        </svg>

        {/* Bottom description */}
        <div
          style={{
            minHeight: "58px",
            marginTop: "12px",
            padding: "10px 14px",
            background: displayOrgan ? "#f4f2ff" : "transparent",
            border: `1px solid ${displayOrgan ? "#ddd8ff" : "transparent"}`,
            borderRadius: "10px",
            textAlign: "center",
            transition: "background 0.2s, border-color 0.2s",
          }}
        >
          {displayOrgan ? (
            <>
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#222", marginBottom: "3px" }}>
                {organDetails[displayOrgan].label}
              </p>
              <p style={{ fontSize: "0.8rem", color: "#777" }}>{organDetails[displayOrgan].desc}</p>
            </>
          ) : (
            <p style={{ fontSize: "0.78rem", color: "#bbb8cc" }}>장기를 클릭하면 자세한 정보가 표시됩니다</p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#3b82f6" }} />
          <span style={{ fontSize: "0.78rem", color: "#888" }}>강한 장기</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#e53e3e" }} />
          <span style={{ fontSize: "0.78rem", color: "#888" }}>약한 장기</span>
        </div>
      </div>
    </motion.div>
  );
}

const constitutionInfo: Record<string, { hanja: string; meaning: string }> = {
  태양인: { hanja: "폐대이간소(肺大而肝小)", meaning: "폐가 크고, 간이 작음" },
  소양인: { hanja: "비대이신소(脾大而腎小)", meaning: "췌장이 크고, 신장이 작음" },
  태음인: { hanja: "간대이폐소(肝大而肺小)", meaning: "간이 크고, 폐가 작음" },
  소음인: { hanja: "신대이비소(腎大而脾小)", meaning: "신장이 크고, 췌장이 작음" },
};

function Toast({ visible }: { visible: boolean }) {
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
      복사됐습니다 ✓
    </motion.div>
  );
}

function ShareModal({ constitutionType, scores, onClose }: { constitutionType: string; scores: Record<string, number>; onClose: () => void }) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const params = new URLSearchParams({ type: constitutionType });
  ["태양인", "소양인", "태음인", "소음인"].forEach((t) => {
    params.set(t, String(total > 0 ? Math.round((scores[t] || 0) / total * 100) : 0));
  });
  const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  const [showToast, setShowToast] = useState(false);

  const handleKakao = () => {
    if (!window.Kakao) return;
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_APP_KEY);
    }
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: `나는 ${constitutionType}! 당신의 체질은?`,
        description: "사상체질 테스트로 나의 체질을 알아보세요.",
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [
        {
          title: "결과 확인하기",
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
        <div style={{ width: "40px", height: "4px", background: "#e0e0e0", borderRadius: "2px", margin: "0 auto 24px" }} />
        <p className="font-bold" style={{ fontSize: "1.1rem", color: "#111", textAlign: "center", marginBottom: "6px" }}>
          친구에게 공유하기
        </p>
        <p style={{ fontSize: "0.875rem", color: "#888", textAlign: "center", marginBottom: "24px" }}>
          결과 링크를 친구에게 공유해보세요
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
              <path d="M12 3C6.477 3 2 6.477 2 10.909c0 2.756 1.528 5.19 3.878 6.702l-.99 3.697 4.27-2.817A11.64 11.64 0 0012 18.818c5.523 0 10-3.476 10-7.909C22 6.477 17.523 3 12 3z" fill="#3C1E1E"/>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
            링크 복사하기
          </motion.button>
        </div>
      </motion.div>
      <Toast visible={showToast} />
    </>
  );
}

function Buttons({ onRetry, constitutionType, scores, isShared = false }: { onRetry: () => void; constitutionType: string; scores: Record<string, number>; isShared?: boolean }) {
  const [showModal, setShowModal] = useState(false);

  if (isShared) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
      >
        <motion.button
          onClick={() => { window.location.href = "/"; }}
          className="font-semibold transition-all duration-200"
          style={{
            width: "100%",
            padding: "17px",
            borderRadius: "50px",
            background: "#0774C4",
            border: "1.5px solid #0774C4",
            color: "#ffffff",
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
          whileHover={{ background: "#0560a8", borderColor: "#0560a8" }}
          whileTap={{ scale: 0.99 }}
        >
          내 체질도 알아보기
        </motion.button>
      </motion.div>
    );
  }

  return (
    <>
      {/* COUPANG PARTNERS AD */}
      <CoupangBanner constitutionType={constitutionType} />

      <motion.div
        style={{ display: "flex", gap: "8px" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
      >
        <motion.button
          onClick={onRetry}
          className="font-semibold transition-all duration-200"
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
          whileHover={{ borderColor: "#0774C4", color: "#0774C4" }}
          whileTap={{ scale: 0.99 }}
        >
          다시 테스트하기
        </motion.button>

        <motion.button
          onClick={() => setShowModal(true)}
          className="font-semibold transition-all duration-200"
          style={{
            flex: 1,
            padding: "17px",
            borderRadius: "50px",
            background: "#0774C4",
            border: "1.5px solid #0774C4",
            color: "#ffffff",
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
          whileHover={{ background: "#0560a8", borderColor: "#0560a8" }}
          whileTap={{ scale: 0.99 }}
        >
          친구에게 공유하기
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <ShareModal
            constitutionType={constitutionType}
            scores={scores}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

const coupangIds: Record<string, number> = {
  태양인: 975890,
  태음인: 975913,
  소양인: 975916,
  소음인: 975919,
};

function CoupangBanner({ constitutionType }: { constitutionType: string }) {
  const id = coupangIds[constitutionType] ?? 975890;
  return (
    <div
      className="rounded-2xl"
      style={{
        background: "#ffffff",
        border: "1px solid #eeeeee",
        marginBottom: "0.75rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "2rem 2rem 1rem" }}>
        <SectionLabel>Recommended Drinks</SectionLabel>
      </div>
      <iframe
        src={`https://ads-partners.coupang.com/widgets.html?id=${id}&template=carousel&trackingCode=AF8415971&subId=&width=680&height=140&tsource=`}
        width="100%"
        height="140"
        frameBorder="0"
        scrolling="no"
        referrerPolicy="unsafe-url"
        style={{ display: "block" }}
      />
      <p style={{ fontSize: "11px", color: "#999", margin: "4px 2rem 1rem", textAlign: "center" }}>
        쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </div>
  );
}

export default function ResultPage({ constitutionType, scores, onRetry, isShared = false }: Props) {
  const result = results[constitutionType];
  const constitution = constitutionInfo[constitutionType];

  useEffect(() => {
    if (isSupabaseReady && constitutionType) {
      supabase.from("analytics").insert({ event_type: "quiz_complete", constitution_type: constitutionType });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!result) return null;

  const secondType = Object.entries(scores)
    .filter(([type]) => type !== constitutionType)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  const result2 = results[secondType];

  return (
    <motion.div
      className="fixed left-0 right-0 bottom-0 overflow-y-auto"
      style={{ top: "56px", background: "#f8f8f8" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top accent bar */}
      <div style={{ height: "3px", background: "linear-gradient(90deg, #0774C4, #8EBEF9)" }} />

      {/* ── Hero ── */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #eeeeee" }}>
      <div
        className="flex flex-col items-center text-center"
        style={{
          width: "100%",
          maxWidth: "560px",
          margin: "0 auto",
          padding: "clamp(3rem, 6vw, 5rem) 1.5rem clamp(1.5rem, 3vw, 2.5rem)",
        }}
      >
        {/* Section label */}
        <motion.div
          className="flex items-center gap-3 mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="h-px w-8" style={{ background: "#0774C4" }} />
          <span
            className="font-semibold uppercase"
            style={{ fontSize: "10px", letterSpacing: "0.28em", color: "#0774C4" }}
          >
            Your Result
          </span>
          <div className="h-px w-8" style={{ background: "#0774C4" }} />
        </motion.div>

        {/* Constitution type */}
        <motion.h1
          className="font-extrabold"
          style={{
            fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
            letterSpacing: "-0.05em",
            lineHeight: 1,
            color: "#111111",
            marginTop: "24px",
            marginBottom: "1rem",
          }}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          {result.type}
        </motion.h1>

        {/* Blue accent under title */}
        <motion.div
          style={{
            width: "48px",
            height: "3px",
            background: "#0774C4",
            borderRadius: "2px",
            marginBottom: "0.75rem",
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.38, duration: 0.5 }}
        />

        {/* Subtitle */}
        <motion.p
          className="font-semibold"
          style={{ fontSize: "1.1rem", color: "#333333", marginBottom: "1.25rem" }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.5 }}
        >
          {result.subtitle}
        </motion.p>

        {/* Description */}
        <motion.p
          style={{
            fontSize: "0.975rem",
            color: "#666666",
            maxWidth: "480px",
            lineHeight: 1.85,
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.5 }}
        >
          {result.description.split('. ').map((sentence, i, arr) => {
            const text = i < arr.length - 1 ? sentence + '.' : sentence;
            const parts = text.split('\n');
            return (
              <span key={i}>
                {parts.map((part, j) => (
                  <span key={j}>{part}{j < parts.length - 1 && <br />}</span>
                ))}
                {i < arr.length - 1 && <br />}
              </span>
            );
          })}
        </motion.p>
      </div>
      </div>

      {/* ── Content ── */}
      <div
        style={{
          display: "block",
          width: "100%",
          maxWidth: "560px",
          margin: "0 auto",
          padding: "1.5rem 1.5rem 0",
          paddingBottom: '20px',
        }}
      >

        {/* SCORE GAUGE */}
        {scores && Object.keys(scores).length > 0 && (
          <>
            <ScoreGauge scores={scores} />
            <BarGauge scores={scores} />
          </>
        )}

        {/* CONSTITUTION */}
        <motion.div
          className="rounded-2xl text-center"
          style={{
            background: "#ffffff",
            border: "1px solid #eeeeee",
            padding: "2rem",
            marginBottom: "0.75rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <SectionLabel>Constitution</SectionLabel>
          <div className="mt-6" style={{ marginTop: "24px" }}>
            <p
              className="font-extrabold"
              style={{ fontSize: "clamp(1.1rem, 4vw, 1.5rem)", color: "#111111", letterSpacing: "-0.02em", lineHeight: 1.2 }}
            >
              {constitution?.hanja}
            </p>
            <p className="text-sm text-gray-400 mt-2">{constitution?.meaning}</p>
          </div>
        </motion.div>

        {/* ORGAN ILLUSTRATION */}
        <OrganIllustration constitutionType={constitutionType} />

        {/* RECOMMENDED DRINKS */}
        <motion.div
          className="rounded-2xl"
          style={{
            background: "#ffffff",
            border: "1px solid #eeeeee",
            padding: "2rem",
            marginBottom: "0.75rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72, duration: 0.5 }}
        >
          <SectionLabel>Recommended Drinks</SectionLabel>

          {/* 1위 체질 추천 */}
          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0774C4", marginTop: "20px", marginBottom: "10px", letterSpacing: "0.04em" }}>
            1위 체질 추천 · {result.type}
          </p>
          <div className="flex flex-col gap-3">
            {result.drinks.map((drink, i) => (
              <motion.div
                key={drink.name}
                className="flex items-center gap-4"
                style={{ padding: "16px 18px", borderRadius: "12px", background: "#f8f8f8", border: "1px solid #eeeeee" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.78 + i * 0.07, duration: 0.4 }}
              >
                <span style={{ fontSize: "1.75rem", lineHeight: 1, flexShrink: 0 }}>{drink.emoji}</span>
                <div>
                  <p className="font-semibold" style={{ fontSize: "0.97rem", color: "#111111", marginBottom: "2px" }}>{drink.name}</p>
                  <p style={{ fontSize: "0.85rem", color: "#888888", lineHeight: 1.5 }}>{drink.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 2위 체질 추천 */}
          {result2 && (
            <>
              <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#888888", marginTop: "20px", marginBottom: "10px", letterSpacing: "0.04em" }}>
                2위 체질 추천 · {result2.type}
              </p>
              <div className="flex flex-col gap-3">
                {result2.drinks.map((drink, i) => (
                  <motion.div
                    key={drink.name}
                    className="flex items-center gap-4"
                    style={{ padding: "16px 18px", borderRadius: "12px", background: "#f8f8f8", border: "1px solid #eeeeee" }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.06 + i * 0.07, duration: 0.4 }}
                  >
                    <span style={{ fontSize: "1.75rem", lineHeight: 1, flexShrink: 0 }}>{drink.emoji}</span>
                    <div>
                      <p className="font-semibold" style={{ fontSize: "0.97rem", color: "#111111", marginBottom: "2px" }}>{drink.name}</p>
                      <p style={{ fontSize: "0.85rem", color: "#888888", lineHeight: 1.5 }}>{drink.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* CHARACTERISTICS */}
        <motion.div
          className="rounded-2xl text-center"
          style={{
            background: "#ffffff",
            border: "1px solid #eeeeee",
            padding: "2rem",
            marginBottom: "0.75rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.84, duration: 0.5 }}
        >
          <SectionLabel>Characteristics</SectionLabel>
          <div className="flex flex-wrap gap-2 justify-center" style={{ marginTop: "24px" }}>
            {result.traits.map((trait) => (
              <span
                key={trait}
                className="font-medium whitespace-normal text-center w-[calc(50%-4px)]"
                style={{
                  fontSize: "0.875rem",
                  padding: "5px 14px",
                  borderRadius: "50px",
                  background: "#f0f7ff",
                  color: "#0774C4",
                  border: "1px solid #c8e0f8",
                }}
              >
                {trait}
              </span>
            ))}
          </div>
        </motion.div>

        {/* LIFESTYLE GUIDE */}
        <motion.div
          className="rounded-2xl"
          style={{
            background: "#ffffff",
            border: "1px solid #eeeeee",
            padding: "2rem",
            marginBottom: "0.75rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.96, duration: 0.5 }}
        >
          <SectionLabel>Lifestyle Guide</SectionLabel>
          <div className="flex flex-col gap-5 mt-7" style={{ marginTop: "24px" }}>
            {result.lifestyle.map((tip, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.02 + i * 0.07, duration: 0.4 }}
              >
                {/* Number */}
                <span
                  className="font-extrabold flex-shrink-0 tabular-nums"
                  style={{
                    fontSize: "1.5rem",
                    lineHeight: 1,
                    color: "#ddeeff",
                    letterSpacing: "-0.04em",
                    paddingTop: "1px",
                    minWidth: "32px",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "#333333",
                    lineHeight: 1.75,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {tip}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Buttons */}
        <Buttons onRetry={onRetry} constitutionType={constitutionType} scores={scores} isShared={isShared} />

        {/* Reference footer */}
        <p className="pb-6 text-xs text-gray-400 text-center px-4" style={{ lineHeight: 1.8, marginTop: '20px' }}>
          본 설문은 아래 자료를 기반으로 제작되었습니다.<br />
          이제마 동의수세보원(東醫壽世保元)<br />
          이제마 성정의 불변성(性情之不變性)<br />
          대한한의사협회(Korean Medical Association)
        </p>
      </div>
    </motion.div>
  );
}
