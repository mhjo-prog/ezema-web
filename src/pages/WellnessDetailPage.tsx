import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

const KAKAO_APP_KEY = "fbf533c6007cf5212883947fe851e02d";

declare global {
  interface Window {
    Kakao: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: { sendDefault: (options: Record<string, unknown>) => void };
    };
  }
}

function Toast({ visible }: { visible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16 }}
      transition={{ duration: 0.22 }}
      style={{
        position: "fixed", bottom: "88px", left: "50%", transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.78)", color: "#ffffff",
        padding: "11px 24px", borderRadius: "50px",
        fontSize: "0.9rem", fontWeight: 600,
        pointerEvents: "none", zIndex: 600, whiteSpace: "nowrap",
      }}
    >
      복사됐습니다 ✓
    </motion.div>
  );
}

function ShareModal({ onClose }: { onClose: () => void }) {
  const [showToast, setShowToast] = useState(false);
  const shareUrl = window.location.href;

  const handleKakao = () => {
    if (!window.Kakao) return;
    if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_APP_KEY);
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: "KeepSlow - 사상체질 테스트",
        description: "나의 체질을 알아보세요.",
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [{ title: "결과 보기", link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setShowToast(true);
    setTimeout(() => { setShowToast(false); onClose(); }, 1800);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 500 }}
      />
      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#ffffff", borderRadius: "20px 20px 0 0",
          padding: "20px 24px 40px", zIndex: 501,
          maxWidth: "560px", margin: "0 auto",
        }}
      >
        <div style={{ width: "40px", height: "4px", background: "#e0e0e0", borderRadius: "2px", margin: "0 auto 24px" }} />
        <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111", textAlign: "center", marginBottom: "6px" }}>
          친구에게 공유하기
        </p>
        <p style={{ fontSize: "0.875rem", color: "#888", textAlign: "center", marginBottom: "24px" }}>
          결과 링크를 친구에게 공유해보세요
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <motion.button
            onClick={handleKakao} whileTap={{ scale: 0.98 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              width: "100%", padding: "16px", borderRadius: "14px",
              background: "#FEE500", border: "none", color: "#3C1E1E",
              fontSize: "0.975rem", fontWeight: 600, cursor: "pointer",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C6.477 3 2 6.477 2 10.909c0 2.756 1.528 5.19 3.878 6.702l-.99 3.697 4.27-2.817A11.64 11.64 0 0012 18.818c5.523 0 10-3.476 10-7.909C22 6.477 17.523 3 12 3z" fill="#3C1E1E"/>
            </svg>
            카카오톡으로 보내기
          </motion.button>
          <motion.button
            onClick={handleCopy} whileTap={{ scale: 0.98 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              width: "100%", padding: "16px", borderRadius: "14px",
              background: "#f5f5f5", border: "1.5px solid #e5e5e5", color: "#333333",
              fontSize: "0.975rem", fontWeight: 600, cursor: "pointer",
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

function BottomButtons({ backPath, navigate }: { backPath: string; navigate: (path: string) => void }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <div style={{ borderTop: "1px solid #eeeeee", marginTop: "32px", paddingTop: "28px" }}>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <motion.button
            onClick={() => navigate(backPath)}
            whileTap={{ scale: 0.99 }}
            style={{
              flex: 1, padding: "17px", borderRadius: "50px",
              background: "#ffffff", border: "1.5px solid #dddddd",
              color: "#666666", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
            }}
            whileHover={{ borderColor: "#111111", color: "#111111" }}
          >
            목록으로 돌아가기
          </motion.button>
          <motion.button
            onClick={() => setShowModal(true)}
            whileTap={{ scale: 0.99 }}
            style={{
              flex: 1, padding: "17px", borderRadius: "50px",
              background: "#111111", border: "1.5px solid #111111",
              color: "#ffffff", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
            }}
            whileHover={{ background: "#333333", borderColor: "#333333" }}
          >
            친구에게 공유하기
          </motion.button>
        </div>
      </div>
      <AnimatePresence>
        {showModal && <ShareModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
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

        {/* 하단 버튼 */}
        <BottomButtons backPath="/wellness" navigate={navigate} />
      </div>
    </motion.div>
  );
}
