import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

/**
 * 저장(북마크) 등 로그인이 필요한 액션에서 띄우는 하단 시트.
 * 결과 페이지의 SaveResultModal과 동일한 톤을 따른다.
 */
export default function LoginPromptSheet({ onClose }: { onClose: () => void }) {
  const { loginWithKakao, isLoading } = useAuth();

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
        role="dialog"
        aria-modal="true"
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

        <p className="font-bold" style={{ fontSize: "1.15rem", color: "#111", textAlign: "center", marginBottom: "8px" }}>
          저장하려면 로그인이 필요해요
        </p>
        <ul style={{ fontSize: "0.875rem", color: "#888", marginBottom: "28px", lineHeight: 1.7, textAlign: "center", listStyle: "none", padding: 0 }}>
          <li>관심 있는 글을 마이페이지에 모아볼 수 있어요</li>
          <li>지금 로그인하면 이 글이 바로 저장됩니다</li>
        </ul>

        <motion.button
          onClick={() => loginWithKakao()}
          disabled={isLoading}
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
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C6.477 3 2 6.477 2 10.909c0 2.756 1.528 5.19 3.878 6.702l-.99 3.697 4.27-2.817A11.64 11.64 0 0012 18.818c5.523 0 10-3.476 10-7.909C22 6.477 17.523 3 12 3z" fill="#3C1E1E"/>
          </svg>
          {isLoading ? "로그인 중..." : "카카오로 로그인하고 저장하기"}
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
