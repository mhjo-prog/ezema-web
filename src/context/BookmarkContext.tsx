import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";
import { flushPendingBookmark, getSavedPostIds, setPendingBookmark, toggleSavedDB } from "../lib/bookmarks";
import { isSupabaseReady, supabase } from "../lib/supabase";
import LoginPromptSheet from "../components/LoginPromptSheet";

interface BookmarkContextType {
  isSavedGlobal: (id: string) => boolean;
  toggleBookmark: (id: string, postType: "posts" | "wellness_posts") => Promise<void>;
  /** 저장한 콘텐츠가 하나라도 있는지 (저장 안내 노출 판단용) */
  hasAnySaved: boolean;
  /** 북마크 목록 로드가 끝났는지 — 로드 전 잘못된 안내 노출을 막는다 */
  bookmarksLoaded: boolean;
}

const BookmarkContext = createContext<BookmarkContextType>({
  isSavedGlobal: () => false,
  toggleBookmark: async () => {},
  hasAnySaved: false,
  bookmarksLoaded: false,
});

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false);
  const [showLoginSheet, setShowLoginSheet] = useState(false);

  useEffect(() => {
    async function load() {
      setBookmarksLoaded(false);
      if (user) {
        if (!isSupabaseReady) return;
        // 비로그인 상태에서 저장을 눌러둔 글이 있으면 먼저 반영한 뒤 목록을 읽는다
        await flushPendingBookmark(user.kakao_id);
        const { data } = await supabase
          .from("bookmarks")
          .select("post_id")
          .eq("kakao_id", user.kakao_id);
        setSavedIds(new Set((data ?? []).map((r: { post_id: string }) => r.post_id)));
      } else {
        setSavedIds(new Set(getSavedPostIds()));
      }
      setBookmarksLoaded(true);
    }
    load();
  }, [user]);

  const isSavedGlobal = useCallback((id: string) => savedIds.has(id), [savedIds]);

  const toggleBookmark = useCallback(
    async (id: string, postType: "posts" | "wellness_posts") => {
      // 비로그인: 저장하지 않고 로그인 안내 — 누른 글은 기억해뒀다 로그인 직후 저장
      if (!user) {
        setPendingBookmark(id, postType);
        setShowLoginSheet(true);
        return;
      }
      const newSaved = await toggleSavedDB(user.kakao_id, id, postType);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (newSaved) next.add(id);
        else next.delete(id);
        return next;
      });
    },
    [user]
  );

  return (
    <BookmarkContext.Provider value={{ isSavedGlobal, toggleBookmark, hasAnySaved: savedIds.size > 0, bookmarksLoaded }}>
      {children}
      <AnimatePresence>
        {showLoginSheet && <LoginPromptSheet onClose={() => setShowLoginSheet(false)} />}
      </AnimatePresence>
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  return useContext(BookmarkContext);
}
