import { supabase, isSupabaseReady } from "./supabase";

export const KAKAO_REST_KEY = "ef0141cd1ed5cf2e0e3e2b231fc3f16c";
export const KAKAO_JS_KEY = "fbf533c6007cf5212883947fe851e02d";
export const REDIRECT_URI =
  window.location.hostname === "localhost"
    ? "http://localhost:5173/auth/kakao/callback"
    : "https://keepslow.kr/auth/kakao/callback";

export interface KakaoUser {
  kakao_id: string;
  nickname: string;
  email?: string;
  profile_image?: string;
}

export async function upsertKakaoUser(user: KakaoUser): Promise<void> {
  if (!isSupabaseReady) return;
  await supabase
    .from("kakao_users")
    .upsert(
      {
        kakao_id: user.kakao_id,
        nickname: user.nickname,
        email: user.email ?? null,
        profile_image: user.profile_image ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "kakao_id" }
    );
}
