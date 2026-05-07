import { supabase, isSupabaseReady } from "./supabase";

const SAVED_POSTS_KEY = "ezema_saved_posts";

// ── localStorage (비로그인) ──────────────────────────────────────

export function getSavedPostIds(): string[] {
  try { return JSON.parse(localStorage.getItem(SAVED_POSTS_KEY) || "[]"); }
  catch { return []; }
}

export function isSaved(id: string): boolean {
  return getSavedPostIds().includes(id);
}

export function toggleSaved(id: string): boolean {
  const ids = getSavedPostIds();
  const idx = ids.indexOf(id);
  if (idx >= 0) ids.splice(idx, 1);
  else ids.push(id);
  localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(ids));
  return idx < 0; // true = 저장됨
}

// ── Supabase DB (로그인 시) ──────────────────────────────────────

export async function isSavedDB(kakaoId: string, postId: string): Promise<boolean> {
  if (!isSupabaseReady) return false;
  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("kakao_id", kakaoId)
    .eq("post_id", postId)
    .maybeSingle();
  return !!data;
}

export async function toggleSavedDB(
  kakaoId: string,
  postId: string,
  postType: "posts" | "wellness_posts"
): Promise<boolean> {
  if (!isSupabaseReady) return false;
  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("kakao_id", kakaoId)
    .eq("post_id", postId)
    .maybeSingle();

  if (data) {
    await supabase.from("bookmarks").delete().eq("kakao_id", kakaoId).eq("post_id", postId);
    return false; // 삭제됨
  } else {
    await supabase.from("bookmarks").insert({ kakao_id: kakaoId, post_id: postId, post_type: postType });
    return true; // 저장됨
  }
}
