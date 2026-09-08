import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DELAY_MS = 800;                     // 진입 후 등장까지
const SIDE_QUERY = "(min-width: 1200px)"; // 이 이상에서만 버튼 오른쪽에 배치

const BORDER = "#e6e6e6";

/**
 * 저장(북마크) 버튼 옆에 떠오르는 안내 말풍선.
 * - 저장한 콘텐츠가 하나도 없는 사용자에게만 노출
 * - 자동으로 사라지지 않고, X 버튼으로 닫는다 (닫기는 현재 글에서만 유효 —
 *   다른 콘텐츠로 이동하면 다시 뜬다. 호출부에서 key={id}로 리마운트시킬 것)
 * - 넓은 화면에서는 버튼 오른쪽, 좁은 화면에서는 버튼 아래에 배치
 * 부모는 position: relative 컨테이너여야 한다.
 */
export default function SaveHintBubble({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(false);
  const [side, setSide] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(SIDE_QUERY).matches : false
  );

  // 화면 폭에 따라 배치 전환
  useEffect(() => {
    const mq = window.matchMedia(SIDE_QUERY);
    const onChange = (e: MediaQueryListEvent) => setSide(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled]);

  // 닫기는 현재 글에서만 유효 — 저장하지 않으므로 다른 글에서는 다시 뜬다
  const dismiss = () => setVisible(false);

  const placement = side
    ? { left: "calc(100% + 12px)", top: "50%", y: "-50%" as const }
    : { right: 0, top: "calc(100% + 10px)", y: 0 };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: side ? -6 : 0, y: side ? "-50%" : -6, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, y: placement.y, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          aria-live="polite"
          style={{
            position: "absolute",
            top: placement.top,
            left: side ? placement.left : undefined,
            right: side ? undefined : 0,
            zIndex: 20,
            width: "max-content",
            maxWidth: side ? "240px" : "min(280px, calc(100vw - 48px))",
            background: "#ffffff",
            border: `1px solid ${BORDER}`,
            color: "#aaaaaa",
            fontSize: "0.8125rem",
            fontWeight: 500,
            lineHeight: 1.55,
            letterSpacing: "-0.01em",
            padding: "11px 34px 11px 14px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            textAlign: "left",
          }}
        >
          {/* 꼬리 — 넓은 화면은 왼쪽, 좁은 화면은 위쪽 */}
          <span
            style={
              side
                ? {
                    position: "absolute",
                    left: "-5px",
                    top: "50%",
                    marginTop: "-5px",
                    width: "10px",
                    height: "10px",
                    background: "#ffffff",
                    borderLeft: `1px solid ${BORDER}`,
                    borderBottom: `1px solid ${BORDER}`,
                    transform: "rotate(45deg)",
                    borderRadius: "0 0 0 2px",
                  }
                : {
                    position: "absolute",
                    top: "-5px",
                    right: "18px",
                    width: "10px",
                    height: "10px",
                    background: "#ffffff",
                    borderTop: `1px solid ${BORDER}`,
                    borderLeft: `1px solid ${BORDER}`,
                    transform: "rotate(45deg)",
                    borderRadius: "2px 0 0 0",
                  }
            }
          />

          저장하면 마이페이지에서 관심 콘텐츠를 모아볼 수 있어요! ✨

          <button
            onClick={dismiss}
            aria-label="안내 닫기"
            style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "22px",
              height: "22px",
              background: "none",
              border: "none",
              borderRadius: "50%",
              color: "#bbbbbb",
              cursor: "pointer",
              padding: 0,
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#666666";
              e.currentTarget.style.background = "#f2f2f2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#bbbbbb";
              e.currentTarget.style.background = "none";
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
