import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getSavedPostIds, toggleSaved, toggleSavedDB } from "../lib/bookmarks";
import { isSupabaseReady, supabase } from "../lib/supabase";

interface BookmarkContextType {
  isSavedGlobal: (id: string) => boolean;
  toggleBookmark: (id: string, postType: "posts" | "wellness_posts") => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextType>({
  isSavedGlobal: () => false,
  toggleBookmark: async () => {},
});

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      if (user) {
        if (!isSupabaseReady) return;
        const { data } = await supabase
          .from("bookmarks")
          .select("post_id")
          .eq("kakao_id", user.kakao_id);
        setSavedIds(new Set((data ?? []).map((r: { post_id: string }) => r.post_id)));
      } else {
        setSavedIds(new Set(getSavedPostIds()));
      }
    }
    load();
  }, [user]);

  const isSavedGlobal = useCallback((id: string) => savedIds.has(id), [savedIds]);

  const toggleBookmark = useCallback(
    async (id: string, postType: "posts" | "wellness_posts") => {
      if (user) {
        const newSaved = await toggleSavedDB(user.kakao_id, id, postType);
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (newSaved) next.add(id);
          else next.delete(id);
          return next;
        });
      } else {
        const newSaved = toggleSaved(id);
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (newSaved) next.add(id);
          else next.delete(id);
          return next;
        });
      }
    },
    [user]
  );

  return (
    <BookmarkContext.Provider value={{ isSavedGlobal, toggleBookmark }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  return useContext(BookmarkContext);
}
