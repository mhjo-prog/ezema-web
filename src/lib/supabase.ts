import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "your_supabase_url_here" &&
  supabaseAnonKey !== "your_supabase_anon_key_here";

export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient);

// Storage 업로드용 — anon key 사용 (버킷 policy에서 INSERT 허용 필요)
export const adminSupabase: SupabaseClient = supabase;

export const isSupabaseReady = isConfigured;

export type ConstitutionType = "태음인" | "소음인" | "태양인" | "소양인";
export type PostStatus = "draft" | "approved" | "published";
export type WellnessCategory = "수면" | "식단" | "운동" | "명상" | "스트레스";

export interface Post {
  id: string;
  title: string;
  content: string;
  card_image_url: string;
  constitution_type: ConstitutionType;
  status: PostStatus;
  scheduled_at: string | null;
  created_at: string;
  view_count: number;
  category?: string;
}

export interface WellnessPost {
  id: string;
  title: string;
  content: string;
  card_image_url: string;
  content_image_url?: string;
  wellness_category: WellnessCategory;
  status: PostStatus;
  scheduled_at: string | null;
  created_at: string;
  view_count?: number;
}
