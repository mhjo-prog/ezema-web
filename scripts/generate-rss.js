// scripts/generate-rss.js
// Supabase에서 published 포스트를 가져와 public/rss.xml 생성

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SITE_URL = "https://keepslow.kr";
const SITE_TITLE = "킵슬로우 - 사상체질 건강 콘텐츠";
const SITE_DESCRIPTION = "사상체질과 웰니스 기반의 건강 정보를 제공합니다.";

function escapeXml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
}

function buildRssItem({ title, content, url, pubDate, category }) {
  const description = stripMarkdown(content).slice(0, 300);
  return `
  <item>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(url)}</link>
    <guid isPermaLink="true">${escapeXml(url)}</guid>
    <description>${escapeXml(description)}</description>
    <category>${escapeXml(category)}</category>
    <pubDate>${new Date(pubDate).toUTCString()}</pubDate>
  </item>`;
}

async function main() {
  console.log("RSS 피드 생성 중...");

  // 사상체질 포스트
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, title, content, constitution_type, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  if (postsError) {
    console.error("posts 조회 오류:", postsError);
    process.exit(1);
  }

  // 웰니스 포스트
  const { data: wellnessPosts, error: wellnessError } = await supabase
    .from("wellness_posts")
    .select("id, title, content, wellness_category, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  if (wellnessError) {
    console.error("wellness_posts 조회 오류:", wellnessError);
    process.exit(1);
  }

  const postItems = (posts || []).map((p) =>
    buildRssItem({
      title: p.title,
      content: p.content,
      url: `${SITE_URL}/wellness/${p.id}`,
      pubDate: p.created_at,
      category: p.constitution_type,
    })
  );

  const wellnessItems = (wellnessPosts || []).map((p) =>
    buildRssItem({
      title: p.title,
      content: p.content,
      url: `${SITE_URL}/wellness/${p.id}`,
      pubDate: p.created_at,
      category: p.wellness_category,
    })
  );

  // 날짜 기준 합치기
  const allItems = [...postItems, ...wellnessItems];

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${allItems.join("\n")}
  </channel>
</rss>`;

  const outputPath = resolve(__dirname, "../public/rss.xml");
  writeFileSync(outputPath, rss, "utf-8");

  console.log(`✅ RSS 피드 생성 완료: ${outputPath}`);
  console.log(`   - 사상체질 포스트: ${(posts || []).length}개`);
  console.log(`   - 웰니스 포스트: ${(wellnessPosts || []).length}개`);
}

main().catch((err) => {
  console.error("오류:", err);
  process.exit(1);
});
