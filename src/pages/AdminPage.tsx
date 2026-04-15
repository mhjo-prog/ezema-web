import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase, isSupabaseReady, type Post, type ConstitutionType } from "../lib/supabase";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import ReactMarkdown from "react-markdown";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { marked } from "marked";
import TurndownService from "turndown";

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

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });
// underline → <u> 태그로 저장
turndown.addRule("underline", {
  filter: ["u"],
  replacement: (content) => `<u>${content}</u>`,
});
// 문단 사이 빈 줄(\n\n) 유지
turndown.addRule("paragraph", {
  filter: "p",
  replacement: (content) => `\n\n${content}\n\n`,
});

type ToolbarCmd =
  | "toggleBold" | "toggleItalic" | "toggleUnderline"
  | "toggleHeading" | "toggleBlockquote"
  | "toggleBulletList" | "toggleOrderedList" | "setHorizontalRule";

const TOOLBAR: { label: string; title: string; cmd: ToolbarCmd; style?: React.CSSProperties }[] = [
  { label: "B",  title: "볼드",       cmd: "toggleBold",        style: { fontWeight: 800 } },
  { label: "I",  title: "이탤릭",     cmd: "toggleItalic",      style: { fontStyle: "italic" } },
  { label: "U",  title: "밑줄",       cmd: "toggleUnderline",   style: { textDecoration: "underline" } },
  { label: "H2", title: "소제목",     cmd: "toggleHeading" },
  { label: "❝",  title: "인용구",     cmd: "toggleBlockquote" },
  { label: "•",  title: "불릿 리스트", cmd: "toggleBulletList" },
  { label: "1.", title: "번호 리스트", cmd: "toggleOrderedList" },
  { label: "—",  title: "구분선",     cmd: "setHorizontalRule" },
];

function contentToHtml(text: string): string {
  // \n\n 기준으로 단락 분리 → <p> 태그로 변환, 단락 사이에 빈 <p> 삽입
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim() !== "");
  if (paragraphs.length > 1) {
    return paragraphs
      .map((p) => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`)
      .join("<p></p>");
  }
  // 마크다운이 포함된 경우 marked로 폴백
  return marked.parse(text, { async: false }) as string;
}

function RichEditor({ initialMarkdown, onChange }: { initialMarkdown: string; onChange: (md: string) => void }) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: contentToHtml(initialMarkdown),
    onUpdate({ editor }) {
      onChangeRef.current(turndown.turndown(editor.getHTML()));
    },
    editorProps: {
      attributes: {
        style: [
          "font-family:'Pretendard',sans-serif",
          "font-size:1rem",
          "line-height:1.7",
          "color:#333333",
          "padding:16px",
          "min-height:450px",
          "outline:none",
          "word-break:break-word",
        ].join(";"),
        class: "rich-editor-content",
      },
    },
  });

  if (!editor) return null;

  function runCmd(cmd: ToolbarCmd) {
    const chain = editor!.chain().focus();
    if (cmd === "toggleBold")         chain.toggleBold().run();
    else if (cmd === "toggleItalic")  chain.toggleItalic().run();
    else if (cmd === "toggleUnderline") chain.toggleUnderline().run();
    else if (cmd === "toggleHeading") chain.toggleHeading({ level: 2 }).run();
    else if (cmd === "toggleBlockquote") chain.toggleBlockquote().run();
    else if (cmd === "toggleBulletList") chain.toggleBulletList().run();
    else if (cmd === "toggleOrderedList") chain.toggleOrderedList().run();
    else if (cmd === "setHorizontalRule") chain.setHorizontalRule().run();
  }

  return (
    <div style={{ border: "1.5px solid #e0e0e0", borderRadius: "8px", overflow: "hidden" }}>
      {/* 툴바 */}
      <div style={{ display: "flex", gap: "2px", padding: "6px 10px", borderBottom: "1px solid #e0e0e0", background: "#f7f8fa", flexWrap: "wrap" }}>
        {TOOLBAR.map((btn, i) => (
          <button
            key={i}
            title={btn.title}
            onMouseDown={(e) => { e.preventDefault(); runCmd(btn.cmd); }}
            style={{
              minWidth: "32px",
              height: "30px",
              padding: "0 6px",
              borderRadius: "5px",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "#333",
              background: "transparent",
              border: "1px solid transparent",
              cursor: "pointer",
              fontFamily: "'Pretendard', sans-serif",
              ...btn.style,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e0e0e0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            {btn.label}
          </button>
        ))}
      </div>
      {/* 에디터 본문 */}
      <EditorContent editor={editor} />
    </div>
  );
}

function PostPreviewModal({
  post,
  onClose,
  onApprove,
  onDelete,
  onSave,
}: {
  post: Post;
  onClose: () => void;
  onApprove: () => void;
  onDelete: () => void;
  onSave: (fields: { title: string; content: string; card_image_url: string }) => Promise<void>;
}) {
  const color = CONSTITUTION_COLORS[post.constitution_type];
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [imageUrl, setImageUrl] = useState(post.card_image_url ?? "");
  const [saving, setSaving] = useState(false);

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "0.9rem",
    color: "#111111",
    boxSizing: "border-box" as const,
    outline: "none",
  };

  async function handleSave() {
    setSaving(true);
    await onSave({ title, content, card_image_url: imageUrl });
    setSaving(false);
    setEditMode(false);
  }

  function handleCancelEdit() {
    setTitle(post.title);
    setContent(post.content);
    setImageUrl(post.card_image_url ?? "");
    setEditMode(false);
  }

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
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* 상단: 체질 태그 + 닫기 */}
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

        {editMode ? (
          /* 편집 모드 */
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888888" }}>제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888888" }}>이미지 URL</label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>

            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: "8px" }}
              />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888888" }}>본문</label>
              <RichEditor
                key={post.id + "_editor"}
                initialMarkdown={content}
                onChange={setContent}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: saving ? "#aaaaaa" : "#111111",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  borderRadius: "10px",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "저장 중..." : "저장하기"}
              </button>
              <button
                onClick={handleCancelEdit}
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
                취소
              </button>
            </div>
          </>
        ) : (
          /* 미리보기 모드 */
          <>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111111", lineHeight: 1.4 }}>{post.title}</h2>

            {post.card_image_url && (
              <img
                src={post.card_image_url}
                alt={post.title}
                style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: "8px" }}
              />
            )}

            <div className="md-preview">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p style={{ marginBottom: '1em', lineHeight: '1.7', fontSize: '1rem', color: '#333333' }}>{children}</p>
                  ),
                }}
              >{post.content}</ReactMarkdown>
            </div>

            {/* 승인 상태 표시 */}
            {post.status === "draft" ? (
              <button
                onClick={onApprove}
                style={{
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
            ) : null}

            {/* 하단 버튼 3개 */}
            <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
              <button
                onClick={() => setEditMode(true)}
                style={{
                  flex: 1,
                  padding: "11px",
                  background: "#f7f8fa",
                  color: "#111111",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  borderRadius: "10px",
                  border: "1.5px solid #e0e0e0",
                  cursor: "pointer",
                }}
              >
                수정하기
              </button>
              <button
                onClick={onDelete}
                style={{
                  flex: 1,
                  padding: "11px",
                  background: "#fff5f3",
                  color: "#E8460A",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  borderRadius: "10px",
                  border: "1.5px solid #E8460A",
                  cursor: "pointer",
                }}
              >
                삭제하기
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: "11px 18px",
                  background: "#f0f0f0",
                  color: "#444444",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                닫기
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

type FeedbackRow = { feedback_score: number | null; feedback_note: string | null };

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Post | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"draft" | "approved" | "published">("draft");
  const [stats, setStats] = useState<{ visits: number; quizCompletes: number } | null>(null);
  const [chartData, setChartData] = useState<{ date: string; visits: number; quizCompletes: number }[]>([]);
  const [chartRange, setChartRange] = useState<"7d" | "30d" | "monthly">("7d");
  const [statsRefreshing, setStatsRefreshing] = useState(false);
  const [postsRefreshing, setPostsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [feedbacks, setFeedbacks] = useState<Record<string, FeedbackRow>>({});
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, { score: number | null; note: string }>>({});
  const [savingFeedback, setSavingFeedback] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchFeedbacks(postIds: string[]) {
    if (!isSupabaseReady || postIds.length === 0) return;
    const { data } = await supabase
      .from("post_feedback")
      .select("post_id, feedback_score, feedback_note")
      .in("post_id", postIds)
      .order("created_at", { ascending: false });
    if (!data) return;
    const map: Record<string, FeedbackRow> = {};
    data.forEach((row: { post_id: string; feedback_score: number | null; feedback_note: string | null }) => {
      if (!map[row.post_id]) map[row.post_id] = { feedback_score: row.feedback_score, feedback_note: row.feedback_note };
    });
    setFeedbacks(map);
    setFeedbackDrafts((prev) => {
      const next = { ...prev };
      Object.entries(map).forEach(([pid, fb]) => {
        if (!next[pid]) next[pid] = { score: fb.feedback_score, note: fb.feedback_note ?? "" };
      });
      return next;
    });
  }

  async function handleSaveFeedback(post: Post) {
    const draft = feedbackDrafts[post.id];
    if (!draft?.score) { showToast("별점을 선택해주세요."); return; }
    setSavingFeedback(post.id);
    const { error } = await supabase.from("post_feedback").insert({
      post_id: post.id,
      constitution_type: post.constitution_type,
      title: post.title,
      original_content: post.content,
      feedback_score: draft.score,
      feedback_note: draft.note || null,
      view_count: post.view_count ?? 0,
    });
    if (!error) {
      setFeedbacks((prev) => ({ ...prev, [post.id]: { feedback_score: draft.score, feedback_note: draft.note || null } }));
      showToast("피드백이 저장되었습니다.");
    } else {
      showToast("저장 중 오류가 발생했습니다.");
    }
    setSavingFeedback(null);
  }

  async function fetchPosts() {
    if (!isSupabaseReady) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .in("status", ["draft", "approved", "published"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data as Post[]);
      fetchFeedbacks(data.map((p: Post) => p.id));
    }
    setLoading(false);
  }

  async function fetchStats() {
    if (!isSupabaseReady) return;

    const { count: visits } = await supabase
      .from("analytics")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "page_visit");
    const { count: quizCompletes } = await supabase
      .from("analytics")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "quiz_complete");
    setStats({ visits: visits ?? 0, quizCompletes: quizCompletes ?? 0 });
  }

  async function fetchChartData(range: "7d" | "30d" | "monthly") {
    if (!isSupabaseReady) return;

    if (range === "7d" || range === "30d") {
      const days = range === "7d" ? 7 : 30;
      const buckets: Record<string, { visits: number; quizCompletes: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        buckets[key] = { visits: 0, quizCompletes: 0 };
      }
      const since = new Date();
      since.setDate(since.getDate() - (days - 1));
      since.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("analytics")
        .select("event_type, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });
      if (data) {
        data.forEach((row) => {
          const d = new Date(row.created_at);
          const key = `${d.getMonth() + 1}/${d.getDate()}`;
          if (buckets[key]) {
            if (row.event_type === "page_visit") buckets[key].visits++;
            else if (row.event_type === "quiz_complete") buckets[key].quizCompletes++;
          }
        });
      }
      setChartData(Object.entries(buckets).map(([date, v]) => ({ date, ...v })));
    } else {
      // 월별 추이: 최근 12개월
      const buckets: Record<string, { visits: number; quizCompletes: number }> = {};
      for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - (11 - i));
        const key = `${String(d.getFullYear()).slice(2)}/${String(d.getMonth() + 1).padStart(2, "0")}`;
        buckets[key] = { visits: 0, quizCompletes: 0 };
      }
      const since = new Date();
      since.setDate(1);
      since.setMonth(since.getMonth() - 11);
      since.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("analytics")
        .select("event_type, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });
      if (data) {
        data.forEach((row) => {
          const d = new Date(row.created_at);
          const key = `${String(d.getFullYear()).slice(2)}/${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (buckets[key]) {
            if (row.event_type === "page_visit") buckets[key].visits++;
            else if (row.event_type === "quiz_complete") buckets[key].quizCompletes++;
          }
        });
      }
      setChartData(Object.entries(buckets).map(([date, v]) => ({ date, ...v })));
    }
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
    if (authed) { fetchPosts(); fetchStats(); fetchChartData("7d"); }
  }, [authed]);

  useEffect(() => {
    if (!authed || !isSupabaseReady) return;
    const interval = setInterval(async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("posts")
        .update({ status: "published" })
        .eq("status", "approved")
        .lte("scheduled_at", now)
        .select("id");
      if (!error && data && data.length > 0) {
        const publishedIds = new Set(data.map((p: { id: string }) => p.id));
        setPosts((prev) =>
          prev.map((p) => (publishedIds.has(p.id) ? { ...p, status: "published" } : p))
        );
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [authed, isSupabaseReady]);

  useEffect(() => {
    if (authed) fetchChartData(chartRange);
  }, [chartRange]);

  async function handleSave(postId: string, fields: { title: string; content: string; card_image_url: string }) {
    if (!isSupabaseReady) return;
    const originalPost = posts.find((p) => p.id === postId);
    const { error } = await supabase.from("posts").update(fields).eq("id", postId);
    if (!error) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...fields } : p)));
      setPreview((prev) => (prev ? { ...prev, ...fields } : null));

      // content가 변경됐을 때만 post_feedback에 학습 데이터 저장
      if (originalPost && fields.content !== originalPost.content) {
        await supabase.from("post_feedback").insert({
          post_id: postId,
          constitution_type: originalPost.constitution_type,
          title: fields.title || originalPost.title,
          original_content: originalPost.content,
          edited_content: fields.content,
        });
      }

      showToast("수정되었습니다.");
    } else {
      showToast("수정 중 오류가 발생했습니다.");
    }
  }

  async function handleDelete(postId: string) {
    if (!isSupabaseReady) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    setDeleting(postId);
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setPreview(null);
      showToast("삭제되었습니다.");
    } else {
      showToast("삭제 중 오류가 발생했습니다.");
    }
    setDeleting(null);
  }

  async function handleApprove(postId: string) {
    if (!isSupabaseReady) return;
    setApproving(postId);
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("posts")
      .update({ status: "approved", scheduled_at: scheduledAt })
      .eq("id", postId);

    if (!error) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "approved", scheduled_at: scheduledAt } : p))
      );
      setPreview(null);
      const scheduledTime = new Date(scheduledAt).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      showToast(`승인 완료! ${scheduledTime}에 자동 게시됩니다.`);
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
  const publishedPosts = posts.filter((p) => p.status === "published");
  const filteredPosts = activeFilter === "draft" ? draftPosts : activeFilter === "approved" ? approvedPosts : publishedPosts;
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE);
  const pagedPosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ height: "calc(100vh - 56px)", overflowY: "auto", background: "#f7f8fa", paddingTop: "56px" }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 24px 80px", display: "flex", gap: "32px", alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0774C4", letterSpacing: "0.08em", marginBottom: "4px" }}>
              ADMIN
            </p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111111" }}>콘텐츠 관리</h1>
          </div>
          <button
            onClick={async () => {
              setPostsRefreshing(true);
              await new Promise((r) => setTimeout(r, 200));
              await Promise.all([fetchPosts(), fetchStats(), fetchChartData(chartRange)]);
              setPostsRefreshing(false);
            }}
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

        <motion.div
          animate={{ opacity: postsRefreshing ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        >
        {/* 통계 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "검토 대기 (Draft)", count: draftPosts.length, color: "#888888", filter: "draft" as const },
            { label: "승인됨 (게시 예정)", count: approvedPosts.length, color: "#1E8A4C", filter: "approved" as const },
            { label: "게시됨 (Published)", count: publishedPosts.length, color: "#0774C4", filter: "published" as const },
          ].map((stat) => {
            const isActive = activeFilter === stat.filter;
            return (
              <div
                key={stat.label}
                onClick={() => { setActiveFilter(stat.filter); setCurrentPage(1); }}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "20px",
                  border: isActive ? `2px solid ${stat.color}` : "1px solid #eeeeee",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                <p style={{ fontSize: "0.8125rem", color: "#888888", marginBottom: "8px" }}>{stat.label}</p>
                <p style={{ fontSize: "2rem", fontWeight: 800, color: stat.color }}>{stat.count}</p>
              </div>
            );
          })}
        </div>

        {/* 게시물 목록 */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888888" }}>불러오는 중...</div>
        ) : filteredPosts.length === 0 ? (
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
            {activeFilter === "draft" ? (
              <>
                <p style={{ fontSize: "1rem" }}>검토할 포스트가 없습니다.</p>
                <p style={{ fontSize: "0.875rem", marginTop: "6px" }}>매일 09:00에 새 초안이 생성됩니다.</p>
              </>
            ) : activeFilter === "approved" ? (
              <>
                <p style={{ fontSize: "1rem" }}>승인된 게시물이 없습니다.</p>
                <p style={{ fontSize: "0.875rem", marginTop: "6px" }}>Draft 탭에서 게시물을 승인하면 여기에 표시됩니다.</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: "1rem" }}>게시된 게시물이 없습니다.</p>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {pagedPosts.map((post) => {
              const color = CONSTITUTION_COLORS[post.constitution_type];
              const isDraft = post.status === "draft";
              const isPublished = post.status === "published";
              return (

                <div
                  key={post.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #eeeeee",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0",
                  }}
                >
                  {/* 상단 행: 썸네일 + 내용 + 버튼 */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
                          color: isDraft ? "#888888" : isPublished ? "#0774C4" : "#1E8A4C",
                          background: isDraft ? "#f0f0f0" : isPublished ? "#0774C414" : "#1E8A4C14",
                          padding: "2px 8px",
                          borderRadius: "20px",
                        }}
                      >
                        {isDraft ? "Draft" : isPublished ? "게시됨" : "승인됨"}
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
                      {post.view_count > 0 && (
                        <span style={{ marginLeft: "8px" }}>👀 {post.view_count}</span>
                      )}
                    </p>
                  </div>

                  {/* 버튼들 */}
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignItems: "flex-start" }}>
                    {/* 별점 표시 (저장된 피드백) */}
                    {feedbacks[post.id]?.feedback_score && (
                      <div style={{ display: "flex", alignItems: "center", gap: "2px", padding: "6px 10px", background: "#fffbf0", borderRadius: "8px", border: "1.5px solid #f0d070" }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} style={{ fontSize: "0.875rem", color: i < (feedbacks[post.id]?.feedback_score ?? 0) ? "#f5a623" : "#e0e0e0" }}>★</span>
                        ))}
                      </div>
                    )}
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

                {/* 피드백 영역 */}
                <div style={{ borderTop: "1px solid #f0f0f0", marginTop: "14px", paddingTop: "14px", display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
                  {/* 별점 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#888888" }}>별점</span>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const selected = (feedbackDrafts[post.id]?.score ?? 0) >= star;
                        return (
                          <button
                            key={star}
                            onClick={() => setFeedbackDrafts((prev) => ({ ...prev, [post.id]: { score: star, note: prev[post.id]?.note ?? "" } }))}
                            style={{
                              fontSize: "1.125rem",
                              color: selected ? "#f5a623" : "#d0d0d0",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              padding: "0 1px",
                              lineHeight: 1,
                            }}
                          >
                            ★
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 메모 */}
                  <div style={{ flex: 1, minWidth: "180px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#888888" }}>메모</span>
                    <input
                      value={feedbackDrafts[post.id]?.note ?? ""}
                      onChange={(e) => setFeedbackDrafts((prev) => ({ ...prev, [post.id]: { score: prev[post.id]?.score ?? null, note: e.target.value } }))}
                      placeholder="이 게시물에 대한 메모..."
                      style={{
                        padding: "7px 10px",
                        border: "1.5px solid #e0e0e0",
                        borderRadius: "8px",
                        fontSize: "0.8125rem",
                        color: "#111111",
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box" as const,
                      }}
                    />
                  </div>

                  {/* 저장 버튼 */}
                  <button
                    onClick={() => handleSaveFeedback(post)}
                    disabled={savingFeedback === post.id}
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "#444444",
                      background: "#ffffff",
                      border: "1.5px solid #e0e0e0",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      cursor: savingFeedback === post.id ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap" as const,
                      flexShrink: 0,
                    }}
                  >
                    {savingFeedback === post.id ? "저장 중..." : "피드백 저장"}
                  </button>
                </div>
                </div>
              );
            })}
          </div>
        )}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "24px" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: currentPage === 1 ? "#cccccc" : "#0774C4",
                border: `1.5px solid ${currentPage === 1 ? "#eeeeee" : "#0774C4"}`,
                padding: "7px 16px",
                borderRadius: "8px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                background: "#ffffff",
              }}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: page === currentPage ? "#ffffff" : "#444444",
                  background: page === currentPage ? "#0774C4" : "#ffffff",
                  border: `1.5px solid ${page === currentPage ? "#0774C4" : "#e0e0e0"}`,
                  padding: "7px 13px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  minWidth: "38px",
                }}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: currentPage === totalPages ? "#cccccc" : "#0774C4",
                border: `1.5px solid ${currentPage === totalPages ? "#eeeeee" : "#0774C4"}`,
                padding: "7px 16px",
                borderRadius: "8px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                background: "#ffffff",
              }}
            >
              &gt;
            </button>
          </div>
        )}
        </motion.div>
        </div>

        {/* 세로 구분선 */}
        <div style={{ width: "1px", background: "#eeeeee", alignSelf: "stretch", flexShrink: 0 }} />

        {/* 고객 방문 추이 */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0774C4", letterSpacing: "0.08em", marginBottom: "4px" }}>
                ANALYTICS
              </p>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111111" }}>고객 방문 추이</h2>
            </div>
            <button
              onClick={async () => {
                setStatsRefreshing(true);
                await new Promise((r) => setTimeout(r, 200));
                await Promise.all([fetchStats(), fetchChartData(chartRange)]);
                setStatsRefreshing(false);
              }}
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
          <motion.div
            animate={{ opacity: statsRefreshing ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
          {/* 통계 카드 */}
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "32px" }}>
              {[
                { label: "총 방문자 수", value: stats.visits, color: "#0774C4" },
                { label: "체질 진단 완료", value: stats.quizCompletes, color: "#1E8A4C" },
              ].map((s) => (
                <div key={s.label} style={{ background: "#ffffff", borderRadius: "12px", padding: "20px", border: "1px solid #eeeeee" }}>
                  <p style={{ fontSize: "0.8125rem", color: "#888888", marginBottom: "8px" }}>{s.label}</p>
                  <p style={{ fontSize: "2rem", fontWeight: 800, color: s.color }}>{s.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {/* 추이 차트 */}
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #eeeeee", padding: "24px", height: "350px", display: "flex", flexDirection: "column" }}>
            {/* 탭 버튼 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111111" }}>
                {{ "7d": "최근 7일", "30d": "최근 1개월", monthly: "월별 추이" }[chartRange]}
              </p>
              <div style={{ display: "flex", gap: "6px" }}>
                {([["7d", "최근 7일"], ["30d", "최근 1개월"], ["monthly", "월별 추이"]] as const).map(([range, label]) => (
                  <button
                    key={range}
                    onClick={() => setChartRange(range)}
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      padding: "8px 16px",
                      borderRadius: "50px",
                      border: `1.5px solid ${chartRange === range ? "#0774C4" : "#0774C4"}`,
                      background: chartRange === range ? "#0774C4" : "#ffffff",
                      color: chartRange === range ? "#ffffff" : "#0774C4",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#888888" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#888888" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: "0.8125rem", borderRadius: "8px", border: "1px solid #eeeeee" }} />
                  <Legend wrapperStyle={{ fontSize: "0.8125rem" }} />
                  <Line type="monotone" dataKey="visits" name="방문자" stroke="#0774C4" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="quizCompletes" name="진단완료" stroke="#1E8A4C" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          </motion.div>
        </div>
      </div>

      {/* 미리보기 모달 */}
      {preview && (
        <PostPreviewModal
          post={preview}
          onClose={() => setPreview(null)}
          onApprove={() => handleApprove(preview.id)}
          onDelete={() => handleDelete(preview.id)}
          onSave={(fields) => handleSave(preview.id, fields)}
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
