import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { supabase, isSupabaseReady } from "../lib/supabase";
import { getSavedPostIds } from "../lib/bookmarks";

const CONSTITUTION_LABELS: Record<string, string> = {
  태양인: "태양인 (太陽人)",
  태음인: "태음인 (太陰人)",
  소양인: "소양인 (少陽人)",
  소음인: "소음인 (少陰人)",
};

const CONSTITUTION_DESC: Record<string, string> = {
  태양인: "창의적이고 사교적인 기질을 가진 체질입니다.",
  태음인: "인내심이 강하고 꾸준한 기질을 가진 체질입니다.",
  소양인: "열정적이고 활동적인 기질을 가진 체질입니다.",
  소음인: "섬세하고 내향적인 기질을 가진 체질입니다.",
};

interface QuizResult {
  constitutionType: string;
  scores: Record<string, number>;
}

interface SavedItem {
  id: string;
  title: string;
  card_image_url: string;
  tag: string;
  created_at: string;
  path: string;
}

function SavedCard({ post, navigate }: { post: SavedItem; navigate: (path: string) => void }) {
  return (
    <div
      onClick={() => navigate(post.path)}
      style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: "1px solid #e8e8e8", borderRadius: "12px", cursor: "pointer", transition: "background 0.15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f8f8"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
    >
      {post.card_image_url ? (
        <img
          src={post.card_image_url}
          alt={post.title}
          style={{ width: "64px", height: "64px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: "64px", height: "64px", borderRadius: "8px", background: "#f0f0f0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "1.25rem", opacity: 0.3 }}>🌿</span>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#111111", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {post.title}
        </p>
        <p style={{ fontSize: "0.75rem", color: "#aaaaaa", marginTop: "4px" }}>{post.tag}</p>
      </div>
      <span style={{ fontSize: "1rem", color: "#cccccc", flexShrink: 0 }}>›</span>
    </div>
  );
}

export default function MyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [savedTypology, setSavedTypology] = useState<SavedItem[]>([]);
  const [savedWellness, setSavedWellness] = useState<SavedItem[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // 로그인 유저: DB에서 가장 최근 퀴즈 결과 조회, 없으면 localStorage fallback
    if (isSupabaseReady) {
      supabase
        .from("quiz_results")
        .select("constitution_type, scores")
        .eq("kakao_id", user.kakao_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.constitution_type) {
            setQuizResult({ constitutionType: data.constitution_type, scores: data.scores ?? {} });
          } else {
            // DB에 없으면 localStorage에서 읽기
            try {
              const raw = localStorage.getItem("ezema_mypage_result");
              if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.constitutionType) setQuizResult(parsed);
              }
            } catch { /* ignore */ }
          }
        });
    } else {
      try {
        const raw = localStorage.getItem("ezema_mypage_result");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.constitutionType) setQuizResult(parsed);
        }
      } catch { /* ignore */ }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!isSupabaseReady) return;

    if (user) {
      // 로그인 상태: DB에서 조회
      supabase
        .from("bookmarks")
        .select("post_id, post_type, created_at")
        .eq("kakao_id", user.kakao_id)
        .then(async ({ data: bookmarks }) => {
          if (!bookmarks?.length) return;

          const bookmarkCreatedAt: Record<string, string> = {};
          bookmarks.forEach((b: any) => { bookmarkCreatedAt[b.post_id] = b.created_at; });

          const postIds = bookmarks.filter((b: any) => b.post_type === "posts").map((b: any) => b.post_id);
          const wellnessIds = bookmarks.filter((b: any) => b.post_type === "wellness_posts").map((b: any) => b.post_id);

          const [{ data: posts }, { data: wellness }] = await Promise.all([
            postIds.length
              ? supabase.from("posts").select("id, title, constitution_type, card_image_url, created_at").in("id", postIds).eq("status", "published")
              : Promise.resolve({ data: [] }),
            wellnessIds.length
              ? supabase.from("wellness_posts").select("id, title, wellness_category, card_image_url, created_at").in("id", wellnessIds).eq("status", "published")
              : Promise.resolve({ data: [] }),
          ]);

          setSavedTypology(
            (posts ?? []).map((p: any) => ({
              id: p.id,
              title: p.title,
              card_image_url: p.card_image_url,
              tag: p.constitution_type,
              created_at: bookmarkCreatedAt[p.id] ?? p.created_at,
              path: `/sasang/${p.id}`,
            })).sort((a: SavedItem, b: SavedItem) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          );
          setSavedWellness(
            (wellness ?? []).map((p: any) => ({
              id: p.id,
              title: p.title,
              card_image_url: p.card_image_url,
              tag: p.wellness_category,
              created_at: bookmarkCreatedAt[p.id] ?? p.created_at,
              path: `/wellness/${p.id}`,
            })).sort((a: SavedItem, b: SavedItem) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          );
        });
    } else {
      // 비로그인 상태: localStorage에서 조회
      const ids = getSavedPostIds();
      if (!ids.length) return;
      Promise.all([
        supabase.from("posts").select("id, title, constitution_type, card_image_url, created_at").in("id", ids).eq("status", "published"),
        supabase.from("wellness_posts").select("id, title, wellness_category, card_image_url, created_at").in("id", ids).eq("status", "published"),
      ]).then(([{ data: posts }, { data: wellness }]) => {
        setSavedTypology(
          (posts ?? []).map((p: any) => ({
            id: p.id,
            title: p.title,
            card_image_url: p.card_image_url,
            tag: p.constitution_type,
            created_at: p.created_at,
            path: `/sasang/${p.id}`,
          })).sort((a: SavedItem, b: SavedItem) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        );
        setSavedWellness(
          (wellness ?? []).map((p: any) => ({
            id: p.id,
            title: p.title,
            card_image_url: p.card_image_url,
            tag: p.wellness_category,
            created_at: p.created_at,
            path: `/wellness/${p.id}`,
          })).sort((a: SavedItem, b: SavedItem) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        );
      });
    }
  }, [user]);

  if (!user) return null;

  const scoreEntries = quizResult
    ? Object.entries(quizResult.scores).sort(([, a], [, b]) => b - a)
    : [];
  const totalScore = scoreEntries.reduce((sum, [, s]) => sum + s, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "'Pretendard', sans-serif",
      }}
    >
      {/* 히어로 스트립 */}
      <div style={{ background: "#feff8e", borderBottom: "1px solid #e8e8e8" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "96px 24px 32px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#999999", marginBottom: "6px" }}>
            KEEPSLOW
          </p>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, color: "#000000", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            Mypage
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* ── 프로필 섹션 ── */}
        <section style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#999999", marginBottom: "20px" }}>
            PROFILE
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", padding: "28px", border: "1px solid #e8e8e8", borderRadius: "16px" }}>
            {user.profile_image ? (
              <img
                src={user.profile_image}
                alt={user.nickname}
                style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid #e8e8e8" }}
              />
            ) : (
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#f5f5f5", border: "1px solid #e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, color: "#000000", flexShrink: 0 }}>
                {user.nickname.charAt(0)}
              </div>
            )}
            <div>
              <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "#000000", letterSpacing: "-0.02em" }}>
                {user.nickname}
              </p>
              {user.email && (
                <p style={{ fontSize: "0.875rem", color: "#999999", marginTop: "4px" }}>{user.email}</p>
              )}
              <p style={{ fontSize: "0.75rem", color: "#bbbbbb", marginTop: "6px", letterSpacing: "0.02em" }}>
                카카오 로그인
              </p>
            </div>
          </div>
        </section>

        <div style={{ height: "1px", background: "#e8e8e8", marginBottom: "48px" }} />

        {/* ── 나의 체질 진단 결과 ── */}
        <section style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#999999", marginBottom: "20px" }}>
            CONSTITUTION TYPE
          </p>

          {quizResult ? (
            <div style={{ padding: "28px", border: "1px solid #e8e8e8", borderRadius: "16px" }}>
              <div style={{ marginBottom: "24px" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999999", marginBottom: "8px" }}>
                  진단 결과
                </p>
                <p style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, color: "#000000", letterSpacing: "-0.03em", marginBottom: "8px" }}>
                  {CONSTITUTION_LABELS[quizResult.constitutionType] ?? quizResult.constitutionType}
                </p>
                <p style={{ fontSize: "0.9rem", color: "#666666", lineHeight: 1.6 }}>
                  {CONSTITUTION_DESC[quizResult.constitutionType]}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {scoreEntries.map(([type, score]) => {
                  const pct = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
                  const isTop = type === quizResult.constitutionType;
                  return (
                    <div key={type}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: isTop ? 700 : 500, color: isTop ? "#000000" : "#666666" }}>
                          {type}
                        </span>
                        <span style={{ fontSize: "0.8125rem", fontWeight: isTop ? 700 : 400, color: isTop ? "#000000" : "#999999" }}>
                          {pct}%
                        </span>
                      </div>
                      <div style={{ height: "4px", background: "#f0f0f0", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: isTop ? "#000000" : "#cccccc", borderRadius: "2px" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f0f0f0", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(["관련 아티클 보기", "다시 진단하기", "지난 결과 다시 보기"] as const).map((label) => (
                  <button
                    key={label}
                    onClick={() => {
                      if (label === "관련 아티클 보기") {
                        navigate(`/sasang?type=${quizResult.constitutionType}`);
                      } else if (label === "다시 진단하기") {
                        navigate("/test");
                      } else {
                        const total = Object.values(quizResult.scores).reduce((a, b) => a + b, 0);
                        const params = new URLSearchParams({ type: quizResult.constitutionType, from: "history" });
                        ["태양인","소양인","태음인","소음인"].forEach(t => {
                          params.set(t, String(total > 0 ? Math.round((quizResult.scores[t] || 0) / total * 100) : 0));
                        });
                        navigate(`/quiz?${params.toString()}`);
                      }
                    }}
                    style={{
                      fontSize: "0.8125rem", fontWeight: 600, padding: "9px 20px",
                      borderRadius: "50px", cursor: "pointer", transition: "all 0.15s",
                      color: "#111111", background: "#ffffff", border: "1px solid #e8e8e8",
                      letterSpacing: "0.01em",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#111111"; e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.borderColor = "#111111"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#111111"; e.currentTarget.style.borderColor = "#e8e8e8"; }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: "48px 28px", border: "1px solid #e8e8e8", borderRadius: "16px", background: "#f5f5f5", textAlign: "center" }}>
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "#333333", marginBottom: "8px" }}>
                아직 체질 진단을 하지 않으셨어요.
              </p>
              <p style={{ fontSize: "0.875rem", color: "#999999", marginBottom: "24px" }}>
                체질 테스트를 통해 나의 사상체질을 알아보세요.
              </p>
              <button
                onClick={() => navigate("/test")}
                style={{ padding: "12px 28px", background: "#000000", color: "#ffffff", fontWeight: 600, fontSize: "0.9rem", borderRadius: "50px", cursor: "pointer", border: "none", letterSpacing: "0.01em" }}
              >
                체질 진단하러 가기
              </button>
            </div>
          )}
        </section>

        <div style={{ height: "1px", background: "#e8e8e8", marginBottom: "48px" }} />

        {/* ── 저장한 콘텐츠 ── */}
        <section style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#999999", marginBottom: "20px" }}>
            SAVED CONTENT
          </p>
          {savedWellness.length === 0 && savedTypology.length === 0 ? (
            <div style={{ padding: "48px 28px", border: "1px solid #e8e8e8", borderRadius: "16px", background: "#f5f5f5", textAlign: "center" }}>
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "#333333", marginBottom: "8px" }}>
                저장한 콘텐츠가 없습니다.
              </p>
              <p style={{ fontSize: "0.875rem", color: "#999999", marginBottom: "24px" }}>
                아티클을 읽고 저장하면 여기에 표시됩니다.
              </p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                {([["Typology Stories", "/sasang"], ["Wellness Comics", "/wellness"]] as const).map(([label, path]) => (
                  <button
                    key={label}
                    onClick={() => navigate(path)}
                    style={{ padding: "9px 20px", background: "#ffffff", color: "#111111", fontWeight: 600, fontSize: "0.8125rem", borderRadius: "50px", cursor: "pointer", border: "1px solid #e8e8e8", letterSpacing: "0.01em", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#111111"; e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.borderColor = "#111111"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#111111"; e.currentTarget.style.borderColor = "#e8e8e8"; }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[...savedWellness, ...savedTypology].map((post) => (
                <SavedCard key={post.id} post={post} navigate={navigate} />
              ))}
            </div>
          )}
        </section>

        <div style={{ height: "1px", background: "#e8e8e8", marginBottom: "48px" }} />

        {/* ── 계정 / 로그아웃 ── */}
        <section>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#999999", marginBottom: "20px" }}>
            ACCOUNT
          </p>
          <button
            onClick={() => { logout(); navigate("/"); }}
            style={{ padding: "12px 28px", background: "transparent", color: "#000000", fontWeight: 600, fontSize: "0.9rem", borderRadius: "50px", cursor: "pointer", border: "1px solid #000000", letterSpacing: "0.01em" }}
          >
            로그아웃
          </button>
        </section>
      </div>
    </motion.div>
  );
}
