import fs from "node:fs";
import path from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";
const BASE_URL = "https://keepslow.kr";

// HTML 엔티티 이스케이프 (title, description 삽입 시 XSS 방지)
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 마크다운/HTML 태그 제거 후 평문 반환
function stripMarkdown(md: string): string {
  return md
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_`~>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface MetaOptions {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  robots?: string;
  extraHead?: string;
  bodyContent?: string;
}

/** index.html 템플릿의 head 태그를 페이지별 메타로 치환한다. */
export function injectMeta(template: string, opts: MetaOptions): string {
  const { title, description, canonical, ogImage, robots, extraHead, bodyContent } = opts;
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);

  let html = template;

  // <title>
  html = html.replace(/<title[^>]*>.*?<\/title>/s, `<title>${safeTitle}</title>`);

  // <meta name="description">
  html = html.replace(
    /<meta\s+name="description"[^>]*>/i,
    `<meta name="description" content="${safeDesc}">`
  );

  // <meta property="og:title">
  html = html.replace(
    /<meta\s+property="og:title"[^>]*>/i,
    `<meta property="og:title" content="${safeTitle}">`
  );

  // <meta property="og:description">
  html = html.replace(
    /<meta\s+property="og:description"[^>]*>/i,
    `<meta property="og:description" content="${safeDesc}">`
  );

  // <meta property="og:url">
  html = html.replace(
    /<meta\s+property="og:url"[^>]*>/i,
    `<meta property="og:url" content="${canonical}">`
  );

  // <link rel="canonical">
  if (html.includes('rel="canonical"')) {
    html = html.replace(
      /<link\s+rel="canonical"[^>]*>/i,
      `<link rel="canonical" href="${canonical}">`
    );
  } else {
    html = html.replace("</head>", `  <link rel="canonical" href="${canonical}">\n</head>`);
  }

  // og:image (있을 때만 치환, 없으면 기존 값 유지)
  if (ogImage) {
    html = html.replace(
      /<meta\s+property="og:image"[^>]*>/i,
      `<meta property="og:image" content="${ogImage}">`
    );
  }

  // robots (추가 삽입)
  if (robots) {
    html = html.replace(
      "</head>",
      `  <meta name="robots" content="${robots}">\n</head>`
    );
  }

  // 추가 head 태그 (JSON-LD 등)
  if (extraHead) {
    html = html.replace("</head>", `  ${extraHead}\n</head>`);
  }

  // body 콘텐츠
  if (bodyContent) {
    html = html.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`);
  }

  return html;
}

/**
 * dist/index.html을 읽어 반환한다.
 * 1) includeFiles로 번들된 로컬 파일 탐색
 * 2) 로컬 파일 없으면 운영 도메인에서 fetch (Preview·로컬 fallback)
 */
async function loadTemplate(): Promise<string> {
  const candidates = [
    path.resolve(process.cwd(), "dist/index.html"),
    path.resolve(__dirname, "dist/index.html"),
    path.resolve(__dirname, "../dist/index.html"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, "utf-8");
      }
    } catch { /* 다음 후보로 */ }
  }
  // 로컬에 없으면 운영 도메인 fetch (Preview 환경 등)
  console.warn("[render] dist/index.html 로컬 없음 — 운영 도메인에서 fetch");
  const resp = await fetch(`${BASE_URL}/`, { headers: { "User-Agent": "vercel-render-bot/1.0" } });
  if (resp.ok) return resp.text();
  throw new Error(`loadTemplate 실패: 로컬 없음 + fetch ${resp.status}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await handleRequest(req, res);
  } catch (err) {
    // 예상치 못한 오류 — 503으로 응답해 봇이 재시도하도록
    console.error("[render] 처리 중 오류:", err);
    res.setHeader("Retry-After", "30");
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Service temporarily unavailable");
  }
}

async function handleRequest(req: VercelRequest, res: VercelResponse) {
  const { type, id } = req.query as { type?: string; id?: string };

  if (!type || !id || (type !== "sasang" && type !== "wellness")) {
    return res.status(400).send("type (sasang|wellness) 과 id 가 필요합니다.");
  }

  const pathPrefix = type === "sasang" ? "sasang" : "wellness";

  // Supabase 미설정이면 fallback (Preview 환경 등)
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("[render] Supabase 환경 변수 미설정 — fallback index.html 반환");
    const template = await loadTemplate();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(template);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const table = type === "sasang" ? "posts" : "wellness_posts";

  const { data, error } = await supabase
    .from(table)
    .select("id, title, content, card_image_url")
    .eq("id", id)
    .eq("status", "published")
    .single();

  const template = await loadTemplate();

  if (error) {
    if (error.code !== "PGRST116") {
      // 네트워크/인증 오류 → fallback index.html 200
      console.error("[render] Supabase 조회 오류:", error.code, error.message);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).send(template);
    }
    // PGRST116 = row 없음(미발행·삭제) → 404 noindex
    const html = injectMeta(template, {
      title: "게시물을 찾을 수 없습니다 - 킵슬로우",
      description: "요청한 게시물이 존재하지 않습니다.",
      canonical: `${BASE_URL}/${pathPrefix}/${id}`,
      robots: "noindex, follow",
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, must-revalidate");
    return res.status(404).send(html);
  }

  if (!data) {
    const html = injectMeta(template, {
      title: "게시물을 찾을 수 없습니다 - 킵슬로우",
      description: "요청한 게시물이 존재하지 않습니다.",
      canonical: `${BASE_URL}/${pathPrefix}/${id}`,
      robots: "noindex, follow",
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, must-revalidate");
    return res.status(404).send(html);
  }

  const description = stripMarkdown(data.content).slice(0, 110);
  const canonical = `${BASE_URL}/${pathPrefix}/${data.id}`;
  // 형식: "{글 제목} - 킵슬로우"
  const title = `${data.title} - 킵슬로우`;

  const articleJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    description,
    url: canonical,
    image: data.card_image_url || `${BASE_URL}/og-image.png`,
    publisher: {
      "@type": "Organization",
      name: "킵슬로우(Keepslow)",
      url: BASE_URL,
    },
  });

  const html = injectMeta(template, {
    title,
    description,
    canonical,
    ogImage: data.card_image_url || `${BASE_URL}/og-image.png`,
    extraHead: `<script type="application/ld+json">${articleJsonLd}</script>`,
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // s-maxage=600: Vercel Edge 10분 캐시
  // stale-while-revalidate=86400: 백그라운드 갱신, 즉시 캐시 응답
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  return res.status(200).send(html);
}
