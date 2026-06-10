import { useLocation, useNavigate } from "react-router-dom";
import ResultPage from "./ResultPage";

export default function ResultRoute() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.constitutionType || !state?.scores) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", fontFamily: "'Pretendard', sans-serif" }}>
        <p style={{ fontSize: "1rem", color: "#666666" }}>결과 데이터가 없습니다.</p>
        <button
          onClick={() => navigate("/test")}
          style={{ padding: "12px 28px", background: "#000000", color: "#ffffff", fontWeight: 600, fontSize: "0.9rem", borderRadius: "50px", cursor: "pointer", border: "none" }}
        >
          체질 진단하러 가기
        </button>
      </div>
    );
  }

  return (
    <ResultPage
      constitutionType={state.constitutionType}
      scores={state.scores}
      onRetry={() => navigate("/test")}
      isHistory={true}
    />
  );
}
