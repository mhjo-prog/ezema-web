import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase, isSupabaseReady, type Post, type ConstitutionType } from "../lib/supabase";

const CONSTITUTION_COLORS: Record<ConstitutionType, string> = {
  태음인: "#1E8A4C",
  소음인: "#6B3FA0",
  태양인: "#E8460A",
  소양인: "#0774C4",
};

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function PostPreviewModal({ post, onClose, onApprove }: { post: Post; onClose: () => void; onApprove: () => void }) {
  const color = CONSTITUTION_COLORS[post.constitution_type];
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          maxWidth: "640px",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color,
              background: `${color}14`,
              padding: "4px 10px",
              borderRadius: "20px",
            }}
          >
            {post.constitution_type}
          </span>
          <button onClick={onClose} style={{ color: "#888888", fontSize: "1.25rem", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111111", lineHeight: 1.4 }}>{post.title}</h2>

        {post.card_image_url && (
          <img
            src={post.card_image_url}
            alt={post.title}
            style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: "8px" }}
          />
        )}

        <p style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "#444444", whiteSpace: "pre-wrap" }}>{post.content}</p>

        <div style={{ display: "flex", gap: "10px", paddingTop: "8px" }}>
          <button
            onClick={onApprove}
            style={{
              flex: 1,
              padding: "12px",
              background: "#0774C4",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.9375rem",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            승인하기
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "12px 20px",
              background: "#f0f0f0",
              color: "#444444",
              fontWeight: 600,
              fontSize: "0.9375rem",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Post | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchPosts() {
    if (!isSupabaseReady) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .in("status", ["draft", "approved"])
      .order("created_at", { ascending: false });

    if (!error && data) setPosts(data as Post[]);
    setLoading(false);
  }

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  }

  useEffect(() => {
    if (authed) fetchPosts();
  }, [authed]);

  async function handleApprove(postId: string) {
    if (!isSupabaseReady) return;
    setApproving(postId);
    const { error } = await supabase
      .from("posts")
      .update({ status: "approved" })
      .eq("id", postId);

    if (!error) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status: "approved" } : p)));
      setPreview(null);
      showToast("승인 완료! 09:30에 자동 게시됩니다.");
    } else {
      showToast("오류가 발생했습니다.");
    }
    setApproving(null);
  }

  // 로그인 화면
  if (!authed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f7f8fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "56px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "40px",
            width: "100%",
            maxWidth: "360px",
            border: "1px solid #eeeeee",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0774C4", letterSpacing: "0.08em", marginBottom: "6px" }}>
              KEEPSLOW
            </p>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#111111" }}>관리자 페이지</h1>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#444444" }}>비밀번호</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setPwError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="비밀번호를 입력하세요"
              style={{
                padding: "12px 14px",
                border: `1.5px solid ${pwError ? "#E8460A" : "#e0e0e0"}`,
                borderRadius: "10px",
                fontSize: "0.9375rem",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            {pwError && (
              <p style={{ fontSize: "0.8125rem", color: "#E8460A" }}>비밀번호가 올바르지 않습니다.</p>
            )}
          </div>

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              padding: "13px",
              background: "#0774C4",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.9375rem",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            로그인
          </button>
        </motion.div>
      </div>
    );
  }

  // 관리자 대시보드
  const draftPosts = posts.filter((p) => p.status === "draft");
  const approvedPosts = posts.filter((p) => p.status === "approved");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ minHeight: "calc(100vh - 56px)", background: "#f7f8fa", paddingTop: "56px" }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0774C4", letterSpacing: "0.08em", marginBottom: "4px" }}>
              ADMIN
            </p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111111" }}>콘텐츠 관리</h1>
          </div>
          <button
            onClick={fetchPosts}
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#0774C4",
              border: "1.5px solid #0774C4",
              padding: "8px 16px",
              borderRadius: "50px",
              cursor: "pointer",
            }}
          >
            새로고침
          </button>
        </div>

        {/* 통계 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "검토 대기 (Draft)", count: draftPosts.length, color: "#888888" },
            { label: "승인됨 (게시 예정)", count: approvedPosts.length, color: "#1E8A4C" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid #eeeeee",
              }}
            >
              <p style={{ fontSize: "0.8125rem", color: "#888888", marginBottom: "8px" }}>{stat.label}</p>
              <p style={{ fontSize: "2rem", fontWeight: 800, color: stat.color }}>{stat.count}</p>
            </div>
          ))}
        </div>

        {/* Draft 목록 */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888888" }}>불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #eeeeee",
              color: "#aaaaaa",
            }}
          >
            <p style={{ fontSize: "1rem" }}>검토할 포스트가 없습니다.</p>
            <p style={{ fontSize: "0.875rem", marginTop: "6px" }}>매일 09:00에 새 초안이 생성됩니다.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {posts.map((post) => {
              const color = CONSTITUTION_COLORS[post.constitution_type];
              const isDraft = post.status === "draft";
              return (
                <div
                  key={post.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #eeeeee",
                    padding: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  {/* 이미지 썸네일 */}
                  <div
                    style={{
                      width: "80px",
                      height: "52px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "#f0f0f0",
                    }}
                  >
                    {post.card_image_url && (
                      <img
                        src={post.card_image_url}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>

                  {/* 내용 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          color,
                          background: `${color}14`,
                          padding: "2px 8px",
                          borderRadius: "20px",
                        }}
                      >
                        {post.constitution_type}
                      </span>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: isDraft ? "#888888" : "#1E8A4C",
                          background: isDraft ? "#f0f0f0" : "#1E8A4C14",
                          padding: "2px 8px",
                          borderRadius: "20px",
                        }}
                      >
                        {isDraft ? "Draft" : "승인됨"}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "#111111",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {post.title}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#aaaaaa", marginTop: "2px" }}>
                      {formatDate(post.created_at)}
                    </p>
                  </div>

                  {/* 버튼들 */}
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button
                      onClick={() => setPreview(post)}
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#444444",
                        border: "1.5px solid #e0e0e0",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      미리보기
                    </button>
                    {isDraft && (
                      <button
                        onClick={() => handleApprove(post.id)}
                        disabled={approving === post.id}
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          color: "#ffffff",
                          background: approving === post.id ? "#aaaaaa" : "#0774C4",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          cursor: approving === post.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {approving === post.id ? "처리 중..." : "승인"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 미리보기 모달 */}
      {preview && (
        <PostPreviewModal
          post={preview}
          onClose={() => setPreview(null)}
          onApprove={() => handleApprove(preview.id)}
        />
      )}

      {/* 토스트 알림 */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#111111",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "50px",
            fontSize: "0.875rem",
            fontWeight: 500,
            zIndex: 200,
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </motion.div>
      )}
    </motion.div>
  );
}
