const SAVED_POSTS_KEY = "ezema_saved_posts";

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
