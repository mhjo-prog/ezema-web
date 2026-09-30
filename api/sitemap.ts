import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Vercel에서 VITE_ 변수는 빌드 전용으로 설정된 경우 런타임에서 못 읽을 수 있음
// → SUPABASE_URL / SUPABASE_ANON_KEY (런타임 전용) 를 우선, VITE_ 를 fallback
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";
const BASE_URL = "https://keepslow.kr";

const STATIC_PAGES = [
  { loc: "/",        changefreq: "weekly",  priority: "1.0" },
  { loc: "/test",    changefreq: "monthly", priority: "0.9" },
  { loc: "/sasang",  changefreq: "weekly",  priority: "0.8" },
  { loc: "/wellness",changefreq: "weekly",  priority: "0.8" },
  { loc: "/about",   changefreq: "monthly", priority: "0.5" },
];

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toW3CDate(iso: string): string {
  return iso.split("T")[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 임시 진단 파라미터 — 배포 후 제거
  if (req.query._debug === "1") {
    return res.status(200).json({
      supabase_url_len: SUPABASE_URL.length,
      supabase_anon_len: SUPABASE_ANON_KEY.length,
      supabase_url_prefix: SUPABASE_URL.slice(0, 8),
      env_keys: Object.keys(process.env).filter(k => k.includes("SUPABASE")).join(", "),
    });
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=600");

  const urls: string[] = [];

  // 1. 정적 페이지
  const now = new Date().toISOString().split("T")[0];
  for (const p of STATIC_PAGES) {
    urls.push(
      `  <url>\n    <loc>${BASE_URL}${p.loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
    );
  }

  // 2. 동적 콘텐츠 (Supabase 미설정이면 정적 페이지만 반환)
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const [postsResult, wellnessResult] = await Promise.all([
      supabase
        .from("posts")
        .select("id, updated_at, created_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false }),
      supabase
        .from("wellness_posts")
        .select("id, updated_at, created_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false }),
    ]);

    if (postsResult.error) console.error("[sitemap] posts query error:", postsResult.error.message);
    if (wellnessResult.error) console.error("[sitemap] wellness_posts query error:", wellnessResult.error.message);

    const posts = postsResult.data;
    const wellnessPosts = wellnessResult.data;
    console.log(`[sitemap] posts: ${posts?.length ?? "null"}, wellness: ${wellnessPosts?.length ?? "null"}`);

    for (const post of posts ?? []) {
      const lastmod = toW3CDate(post.updated_at ?? post.created_at);
      const loc = escapeXml(`${BASE_URL}/sasang/${post.id}`);
      urls.push(
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
      );
    }

    for (const post of wellnessPosts ?? []) {
      const lastmod = toW3CDate(post.updated_at ?? post.created_at);
      const loc = escapeXml(`${BASE_URL}/wellness/${post.id}`);
      urls.push(
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
  return res.status(200).send(xml);
}
