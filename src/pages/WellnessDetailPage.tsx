import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase, isSupabaseReady, type WellnessPost } from "../lib/supabase";

const WELLNESS_CATEGORY_COLORS: Record<string, string> = {
  수면: "#6B3FA0",
  식단: "#1E8A4C",
  운동: "#0774C4",
  명상: "#E8460A",
  스트레스: "#C4A007",
};

function ShareSection() {
  const [toastVisible, setToastVisible] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2000);
    });
  };

  const handleKakao = () => {
    window.open(`https://story.kakao.com/share?url=${encodeURIComponent(window.location.href)}`);
  };

  return (
    <div style={{ marginTop: "48px", textAlign: "center" }}>
      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111111", marginBottom: "6px" }}>친구에게 공유하기</p>
      <p style={{ fontSize: "0.8125rem", color: "#888888", marginBottom: "20px" }}>게시물을 친구에게 공유해보세요</p>
      <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={handleCopyLink}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "0.875rem", fontWeight: 600, color: "#333333",
            background: "#f2f2f2", border: "none", padding: "10px 20px",
            borderRadius: "50px", cursor: "pointer",
          }}
        >
          🔗 링크 복사하기
        </button>
        <button
          onClick={handleKakao}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "0.875rem", fontWeight: 600, color: "#111111",
            background: "#FEE500", border: "none", padding: "10px 20px",
            borderRadius: "50px", cursor: "pointer",
          }}
        >
          💬 카카오톡으로 보내기
        </button>
      </div>
      {toastVisible && (
        <div style={{
          position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)",
          background: "#111111", color: "#ffffff", fontSize: "0.875rem", fontWeight: 500,
          padding: "10px 20px", borderRadius: "50px", zIndex: 9999,
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        }}>
          링크가 복사되었습니다
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function WellnessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<WellnessPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      if (!id || !isSupabaseReady) { setNotFound(true); setLoading(false); return; }
      const { data, error } = await supabase
        .from("wellness_posts")
        .select("*")
        .eq("id", id)
        .eq("status", "published")
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setPost(data as WellnessPost);
        await supabase
          .from("wellness_posts")
          .update({ view_count: (data.view_count ?? 0) + 1 })
          .eq("id", id);
      }
      setLoading(false);
    }
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 56px)",
          paddingTop: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid #e0e0e0", borderTopColor: "#1E8A4C", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 56px)",
          paddingTop: "56px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <span style={{ fontSize: "3rem" }}>🌿</span>
        <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "#333" }}>게시물을 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate("/wellness")}
          style={{ fontSize: "0.875rem", color: "#1E8A4C", fontWeight: 500, textDecoration: "underline", cursor: "pointer" }}
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const color = WELLNESS_CATEGORY_COLORS[post.wellness_category] ?? "#1E8A4C";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: "100vh", background: "#ffffff", paddingTop: "56px" }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* 뒤로 가기 */}
        <button
          onClick={() => navigate("/wellness")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.8125rem",
            color: "#888888",
            fontWeight: 500,
            cursor: "pointer",
            marginBottom: "32px",
          }}
        >
          ← Wellness
        </button>

        {/* 태그 + 날짜 */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color,
              background: `${color}14`,
              padding: "4px 10px",
              borderRadius: "20px",
              letterSpacing: "0.03em",
            }}
          >
            {post.wellness_category}
          </span>
          <span style={{ fontSize: "0.8125rem", color: "#aaaaaa" }}>{formatDate(post.created_at)}</span>
        </div>

        {/* 제목 */}
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "#111111",
            lineHeight: 1.4,
            marginBottom: "28px",
          }}
        >
          {post.title}
        </h1>

        {/* 본문 상세 이미지 (없으면 썸네일로 fallback) */}
        {(post.content_image_url || post.card_image_url) && (
          <div
            style={{
              width: "100%",
              borderRadius: "12px",
              marginBottom: "36px",
              background: "#faf9f6",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              src={post.content_image_url || post.card_image_url}
              alt={post.title}
              style={{ maxWidth: "100%", height: "auto", display: "block", borderRadius: "12px" }}
            />
          </div>
        )}

        {/* 구분선 */}
        <div style={{ borderTop: "1px solid #eeeeee", marginBottom: "36px" }} />

        {/* 본문 */}
        <div className="post-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => (
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111111", margin: "2em 0 0.6em", lineHeight: 1.4 }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#222222", margin: "1.6em 0 0.5em", lineHeight: 1.4 }}>{children}</h3>
              ),
              p: ({ children }) => (
                <p style={{ marginBottom: "1em", lineHeight: "1.7", fontSize: "1rem", color: "#333333" }}>{children}</p>
              ),
              strong: ({ children }) => (
                <strong style={{ fontWeight: 700, color: "#111111" }}>{children}</strong>
              ),
              em: ({ children }) => (
                <em style={{ fontStyle: "italic", color: "#555555" }}>{children}</em>
              ),
              blockquote: ({ children }) => (
                <blockquote style={{ borderLeft: `4px solid ${color}`, margin: "1.6em 0", padding: "12px 20px", background: `${color}0d`, borderRadius: "0 8px 8px 0", color: "#444444", fontStyle: "italic" }}>
                  {children}
                </blockquote>
              ),
              hr: () => (
                <hr style={{ border: "none", borderTop: "1px solid #eeeeee", margin: "2em 0" }} />
              ),
              ul: ({ children }) => (
                <ul style={{ paddingLeft: "1.4em", margin: "0 0 1.4em", lineHeight: 1.95, color: "#333333" }}>{children}</ul>
              ),
              ol: ({ children }) => (
                <ol style={{ paddingLeft: "1.4em", margin: "0 0 1.4em", lineHeight: 1.95, color: "#333333" }}>{children}</ol>
              ),
              li: ({ children }) => (
                <li style={{ fontSize: "1rem", lineHeight: 1.8, marginBottom: "0.4em" }}>{children}</li>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* 하단 구분선 + 돌아가기 */}
        <div style={{ borderTop: "1px solid #eeeeee", marginTop: "32px", paddingTop: "28px" }}>
          <button
            onClick={() => navigate("/wellness")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#111111",
              border: "1.5px solid #111111",
              padding: "10px 20px",
              borderRadius: "50px",
              cursor: "pointer",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#111111";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#111111";
            }}
          >
            목록으로 돌아가기
          </button>
        </div>

        {/* 공유 섹션 */}
        <ShareSection />
      </div>
    </motion.div>
  );
}
