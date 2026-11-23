import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadTemplate(type: "sasang" | "wellness"): string {
  const filename = `${type}/index.html`;
  const candidates = [path.resolve(process.cwd(), `dist/${filename}`)];
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    candidates.push(
      path.resolve(here, `dist/${filename}`),
      path.resolve(here, `../dist/${filename}`)
    );
  } catch { /* cwd 후보만 사용 */ }
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return fs.readFileSync(p, "utf-8");
    } catch { /* 다음 후보로 */ }
  }
  throw new Error(`[list] 템플릿 파일을 찾을 수 없음: ${filename}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { type } = req.query as { type?: string };

  if (!type || (type !== "sasang" && type !== "wellness")) {
    return res.status(400).send("type (sasang|wellness) 가 필요합니다.");
  }

  let template: string;
  try {
    template = loadTemplate(type as "sasang" | "wellness");
  } catch {
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Service temporarily unavailable");
  }

  // Supabase 미설정 시 정적 파일 그대로 반환
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(template);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const table = type === "sasang" ? "posts" : "wellness_posts";

  const { data: posts, error } = await supabase
    .from(table)
    .select("id, title")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(30);

  // 조회 실패 또는 null → seoBlock 없이 정적 템플릿 그대로
  if (error || posts === null) {
    console.error("[list] Supabase 조회 오류:", error?.code, error?.message);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(template);
  }

  const listItems = posts
    .map((p) => `<li><a href="/${type}/${p.id}">${escapeHtml(p.title)}</a></li>`)
    .join("\n");

  const seoBlock = [
    `<section style="max-width:720px;margin:0 auto;padding:24px 16px;line-height:1.7">`,
    `<h2>최신 글</h2>`,
    `<ul>`,
    listItems,
    `</ul>`,
    `</section>`,
  ].join("\n");

  // 기존 root div 내용(skeleton, opacity:0) 앞에 SEO 블록 주입
  // skeleton outer div는 opacity:0 → React 마운트 전까지 비노출
  // seoBlock만 잠깐 노출 → React 마운트 후 기존 UI로 교체
  const html = template.replace('<div id="root">', `<div id="root">${seoBlock}`);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Edge 10분 캐시, 만료 후 24시간 stale-while-revalidate
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  return res.status(200).send(html);
}
