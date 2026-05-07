import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseReady } from "../lib/supabase";

interface HistoryEntry {
  id: string;
  constitution_type: string;
  scores: Record<string, number>;
  created_at: string;
}

export default function HistoryModal({ kakaoId, onClose }: { kakaoId: string; onClose: () => void }) {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseReady) { setLoading(false); return; }
    supabase
      .from("quiz_results")
      .select("id, constitution_type, scores, created_at")
      .eq("kakao_id", kakaoId)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setEntries((data as HistoryEntry[]) ?? []);
        setLoading(false);
      });
  }, [kakaoId]);

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }

  function viewResult(entry: HistoryEntry) {
    const params = new URLSearchParams({ type: entry.constitution_type, from: "history" });
    Object.entries(entry.scores).forEach(([t, v]) => params.set(t, String(v)));
    navigate(`/quiz?${params.toString()}`);
    onClose();
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#ffffff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: "560px", maxHeight: "70vh", overflowY: "auto", padding: "28px 24px 40px" }}
        onWheel={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111111" }}>지난 진단 기록</h3>
          <button onClick={onClose} style={{ color: "#888888", fontSize: "1.25rem", cursor: "pointer", background: "none", border: "none" }}>×</button>
        </div>
        {loading ? (
          <p style={{ textAlign: "center", color: "#aaaaaa", padding: "32px 0" }}>불러오는 중...</p>
        ) : entries.length === 0 ? (
          <p style={{ textAlign: "center", color: "#aaaaaa", padding: "32px 0" }}>저장된 진단 기록이 없습니다.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {entries.map((entry) => {
              const total = Object.values(entry.scores).reduce((a, b) => a + b, 0);
              const topPct = total > 0 ? Math.round((entry.scores[entry.constitution_type] / total) * 100) : 0;
              return (
                <div
                  key={entry.id}
                  onClick={() => viewResult(entry)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", border: "1px solid #eeeeee", borderRadius: "12px", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f8f8"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
                >
                  <div>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111111" }}>{entry.constitution_type}</p>
                    <p style={{ fontSize: "0.8125rem", color: "#aaaaaa", marginTop: "2px" }}>{formatDate(entry.created_at)}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0774C4" }}>{topPct}%</span>
                    <span style={{ fontSize: "0.8125rem", color: "#cccccc" }}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
