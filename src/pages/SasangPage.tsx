import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase, isSupabaseReady, type Post, type ConstitutionType } from "../lib/supabase";
import { samplePosts } from "../data/samplePosts";

const CONSTITUTION_COLORS: Record<ConstitutionType, string> = {
  태음인: "#1E8A4C",
  소음인: "#6B3FA0",
  태양인: "#E8460A",
  소양인: "#0774C4",
};

const FILTERS = ["전체", "태양인", "태음인", "소양인", "소음인"] as const;
type FilterType = (typeof FILTERS)[number];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const color = CONSTITUTION_COLORS[post.constitution_type];
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ opacity: 0.85 }}
      transition={{ duration: 0.18 }}
      style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
    >
      {/* 이미지 */}
      <div
        style={{
          width: "100%",
          aspectRatio: "3 / 2",
          background: "#f0f0f0",
          overflow: "hidden",
          borderRadius: "8px",
          flexShrink: 0,
          marginBottom: "12px",
        }}
      >
        {post.card_image_url && !imgError ? (
          <img
            src={post.card_image_url}
            alt={post.title}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "2rem", opacity: 0.25 }}>🌿</span>
          </div>
        )}
      </div>

      {/* 제목 */}
      <p
        className="card-title"
        style={{
          fontSize: "0.9375rem",
          fontWeight: 600,
          color: "#111111",
          lineHeight: 1.5,
          marginBottom: "8px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {post.title}
      </p>

      {/* 체질 태그 + 날짜 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: color,
            background: `${color}18`,
            padding: "3px 8px",
            borderRadius: "20px",
            letterSpacing: "0.02em",
          }}
        >
          {post.constitution_type}
        </span>
        <span style={{ fontSize: "0.75rem", color: "#aaaaaa" }}>
          {formatDate(post.created_at)}
        </span>
      </div>
    </motion.div>
  );
}

const PAGE_SIZE = 9;

export default function SasangPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("전체");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen]);

  useEffect(() => {
    async function fetchPosts() {
      if (!isSupabaseReady) {
        setPosts(samplePosts);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setPosts(data as Post[]);
      } else {
        setPosts(samplePosts);
      }
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const filtered = posts
    .filter((p) => filter === "전체" || p.constitution_type === filter)
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
    });

  const visiblePosts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  function handleFilterChange(f: FilterType) {
    setFilter(f);
    setVisibleCount(PAGE_SIZE);
  }

  function toggleSearch() {
    if (searchOpen) {
      setSearchOpen(false);
      setSearchQuery("");
    } else {
      setSearchOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        height: "calc(100vh - 56px)",
        overflowY: "auto",
        background: "#ffffff",
        paddingTop: "56px",
      }}
    >
      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* 헤더 */}
        <div style={{ marginBottom: "36px" }}>
          <motion.h1
            style={{ fontSize: "2rem", fontWeight: 800, color: "#000000", lineHeight: 1.2 }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            KEEPSLOW JOURNAL
          </motion.h1>
          <motion.p
            style={{ marginTop: "10px", fontSize: "0.9375rem", color: "#666666", lineHeight: 1.6 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            나의 체질을 이해하면 삶이 달라집니다.<br className="mobile-br" /> 매일 새로운 이야기를 만나보세요.
          </motion.p>
        </div>

        {/* 필터 탭 */}
        <div ref={searchBarRef} style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", scrollbarWidth: "none" }}>
            {FILTERS.map((f) => {
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  className="filter-tab"
                  onClick={() => handleFilterChange(f)}
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: isActive ? "#ffffff" : "#999999",
                    background: isActive ? "#000000" : "#ffffff",
                    border: `1.5px solid ${isActive ? "#000000" : "#dddddd"}`,
                    padding: "7px 16px",
                    borderRadius: "50px",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    letterSpacing: "0.01em",
                    flexShrink: 0,
                  }}
                >
                  {f}
                </button>
              );
            })}

            {/* 검색 아이콘 (SVG) */}
            <button
              onClick={toggleSearch}
              style={{
                marginLeft: "auto",
                flexShrink: 0,
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: `1.5px solid ${searchOpen ? "#000000" : "#e0e0e0"}`,
                background: searchOpen ? "#000000" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s",
                color: searchOpen ? "#ffffff" : "#666666",
              }}
              aria-label="검색"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>

          {/* 검색창 */}
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              style={{ marginTop: "12px" }}
            >
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && toggleSearch()}
                placeholder="검색어를 입력하세요"
                style={{
                  width: "100%",
                  padding: "10px 0",
                  fontSize: "0.9375rem",
                  color: "#111111",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1.5px solid #111111",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </motion.div>
          )}
        </div>

        {/* 카드 그리드 */}
        {loading ? (
          <div
            className="card-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "24px",
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "3/2",
                    borderRadius: "8px",
                    background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                    marginBottom: "12px",
                  }}
                />
                <div style={{ height: "15px", background: "#f0f0f0", borderRadius: "4px", width: "85%", marginBottom: "6px" }} />
                <div style={{ height: "15px", background: "#f0f0f0", borderRadius: "4px", width: "60%", marginBottom: "10px" }} />
                <div style={{ height: "12px", background: "#f0f0f0", borderRadius: "4px", width: "40%" }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: "#aaaaaa",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>🌱</span>
            <p style={{ fontSize: "1rem", fontWeight: 500, color: "#888888" }}>
              {filter === "전체" ? "아직 게시된 글이 없습니다." : `${filter} 이야기를 준비 중입니다.`}
            </p>
            <p style={{ fontSize: "0.875rem", color: "#bbbbbb" }}>매일 새로운 이야기가 추가됩니다.</p>
          </div>
        ) : (
          <>
            <div
              className="card-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "24px",
              }}
            >
              {visiblePosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: Math.min(i % PAGE_SIZE, 5) * 0.07, ease: "easeOut" }}
                >
                  <PostCard post={post} onClick={() => navigate(`/sasang/${post.id}`)} />
                </motion.div>
              ))}
            </div>
            {hasMore && (
              <div ref={sentinelRef} style={{ height: "1px", marginTop: "40px" }} />
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .mobile-br { display: none; }
        @media (max-width: 768px) {
          .card-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .mobile-br { display: block; }
        }
        @media (max-width: 480px) {
          .card-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
          .card-title { font-size: 0.8125rem !important; }
          .filter-tab { font-size: 0.8125rem !important; padding: 5px 11px !important; letter-spacing: -0.1em !important; }
        }
      `}</style>
    </motion.div>
  );
}
