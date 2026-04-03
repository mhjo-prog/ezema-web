import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function WellnessPage() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        minHeight: "calc(100vh - 56px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        gap: "16px",
      }}
    >
      <p style={{ fontSize: "1.5rem", color: "#111111", fontWeight: 700 }}>웰니스</p>
      <p style={{ fontSize: "1rem", color: "#888888" }}>준비 중입니다 🌿</p>
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "8px",
          fontSize: "0.875rem",
          color: "#0774C4",
          fontWeight: 500,
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        홈으로 돌아가기
      </button>
    </motion.div>
  );
}
