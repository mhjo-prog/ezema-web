import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { supabase, isSupabaseReady, type Post, type ConstitutionType } from "../lib/supabase";

const CONSTITUTION_COLORS: Record<ConstitutionType, string> = {
  태음인: "#1E8A4C",
  소음인: "#6B3FA0",
  태양인: "#E8460A",
  소양인: "#0774C4",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function SasangDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      if (!id || !isSupabaseReady) { setNotFound(true); setLoading(false); return; }
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .eq("status", "published")
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setPost(data as Post);
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
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid #e0e0e0", borderTopColor: "#0774C4", animation: "spin 0.8s linear infinite" }} />
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
          onClick={() => navigate("/sasang")}
          style={{ fontSize: "0.875rem", color: "#0774C4", fontWeight: 500, textDecoration: "underline", cursor: "pointer" }}
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const color = CONSTITUTION_COLORS[post.constitution_type];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: "calc(100vh - 56px)", background: "#ffffff", paddingTop: "56px" }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* 뒤로 가기 */}
        <button
          onClick={() => navigate("/sasang")}
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
          ← 사상체질 이야기
        </button>

        {/* 태그 + 날짜 */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: color,
              background: `${color}14`,
              padding: "4px 10px",
              borderRadius: "20px",
              letterSpacing: "0.03em",
            }}
          >
            {post.constitution_type}
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

        {/* 이미지 */}
        {post.card_image_url && (
          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "36px",
              background: "#f7f8fa",
            }}
          >
            <img
              src={post.card_image_url}
              alt={post.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        )}

        {/* 구분선 */}
        <div style={{ borderTop: "1px solid #eeeeee", marginBottom: "36px" }} />

        {/* 본문 */}
        <div className="post-content">
          <ReactMarkdown
            components={{
              h2: ({ children }) => (
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111111", margin: "2em 0 0.6em", lineHeight: 1.4 }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#222222", margin: "1.6em 0 0.5em", lineHeight: 1.4 }}>{children}</h3>
              ),
              p: ({ children }) => (
                <p style={{ marginBottom: '2em', lineHeight: '1.9' }}>{children}</p>
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
        <div style={{ borderTop: "1px solid #eeeeee", marginTop: "56px", paddingTop: "28px" }}>
          <button
            onClick={() => navigate("/sasang")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#0774C4",
              border: "1.5px solid #0774C4",
              padding: "10px 20px",
              borderRadius: "50px",
              cursor: "pointer",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#0774C4";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#0774C4";
            }}
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    </motion.div>
  );
}
