// scripts/collect-trends.js
// 트렌드 수집: Google Trends RSS + Naver DataLab
// Claude API 호출 없음 — 순수 크롤링만

import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Naver DataLab 키워드 그룹 (5개씩 최대 요청) ──────────────────────
const KEYWORD_GROUPS_BATCH1 = [
  { groupName: "면역력", keywords: ["면역력", "면역 강화"] },
  { groupName: "수면", keywords: ["수면", "불면증", "숙면"] },
  { groupName: "스트레스", keywords: ["스트레스", "스트레스 해소"] },
  { groupName: "소화", keywords: ["소화불량", "장건강", "소화"] },
  { groupName: "피로", keywords: ["피로회복", "만성피로"] },
];

const KEYWORD_GROUPS_BATCH2 = [
  { groupName: "체질", keywords: ["체질", "사상체질", "체질 개선"] },
  { groupName: "다이어트", keywords: ["다이어트", "체중관리", "체중 감량"] },
  { groupName: "한방", keywords: ["한방", "한의원", "한약"] },
  { groupName: "혈압혈당", keywords: ["고혈압", "혈압 관리", "혈당"] },
  { groupName: "관절", keywords: ["관절염", "무릎 통증", "관절 건강"] },
];

// 건강 관련 구글 트렌드 필터
const HEALTH_FILTER = [
  "건강", "다이어트", "피부", "면역", "수면", "스트레스",
  "운동", "의료", "병원", "치료", "음식", "영양", "체중",
  "혈압", "당뇨", "한방", "한의", "피로", "비타민",
];

function getDateRange(daysAgo = 7) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysAgo);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { startDate: fmt(start), endDate: fmt(end) };
}

// ── Naver DataLab Search Trend API ──────────────────────────────────
async function fetchNaverBatch(keywordGroups) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  const { startDate, endDate } = getDateRange(7);

  const res = await fetch("https://openapi.naver.com/v1/datalab/search", {
    method: "POST",
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      timeUnit: "date",
      keywordGroups,
      device: "pc",
    }),
  });

  if (!res.ok) {
    console.warn(`  Naver DataLab API 오류: ${res.status}`);
    return [];
  }

  const data = await res.json();
  return (data.results || []).map((result) => {
    // 최근 3일 평균 ratio (0~100)
    const recent = result.data.slice(-3);
    const avg = recent.reduce((s, d) => s + d.ratio, 0) / (recent.length || 1);
    return {
      keyword: result.title,
      source: "naver",
      score: Math.round(avg),
      collected_at: new Date().toISOString(),
    };
  });
}

async function collectNaverTrends() {
  const clientId = process.env.NAVER_CLIENT_ID;
  if (!clientId) {
    console.warn("  ⚠️  NAVER_CLIENT_ID 없음. Naver 트렌드 건너뜀.");
    return [];
  }

  console.log("  Naver DataLab 조회 중...");
  const [batch1, batch2] = await Promise.all([
    fetchNaverBatch(KEYWORD_GROUPS_BATCH1),
    fetchNaverBatch(KEYWORD_GROUPS_BATCH2),
  ]);

  return [...batch1, ...batch2];
}

// ── Google Trends RSS ────────────────────────────────────────────────
async function collectGoogleTrends() {
  console.log("  Google Trends RSS 파싱 중...");
  try {
    const res = await fetch(
      "https://trends.google.com/trends/trendingsearches/daily/rss?geo=KR",
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; KeepSlowBot/1.0)" },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      console.warn(`  Google Trends RSS 오류: ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsed = parser.parse(xml);

    const rawItems = parsed?.rss?.channel?.item || [];
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    const results = [];
    items.slice(0, 25).forEach((item, i) => {
      const title = (item.title || "").toString().trim();
      if (!title) return;

      const isHealth = HEALTH_FILTER.some((kw) => title.includes(kw));
      if (!isHealth && i >= 5) return; // 상위 5개는 무조건 포함

      results.push({
        keyword: title,
        source: "google",
        score: Math.max(100 - i * 4, 10),
        collected_at: new Date().toISOString(),
      });
    });

    return results.slice(0, 12);
  } catch (err) {
    console.warn("  Google Trends 파싱 오류:", err.message);
    return [];
  }
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log("📡 트렌드 수집 시작...\n");

  const [naverTrends, googleTrends] = await Promise.all([
    collectNaverTrends(),
    collectGoogleTrends(),
  ]);

  const allTrends = [...naverTrends, ...googleTrends];

  if (allTrends.length === 0) {
    console.log("수집된 트렌드가 없습니다.");
    return;
  }

  console.log(`\n수집 완료: Naver ${naverTrends.length}개, Google ${googleTrends.length}개`);

  // Supabase에 저장
  const { error } = await supabase.from("trends").insert(allTrends);
  if (error) {
    console.error("Supabase 저장 오류:", error.message);
    process.exit(1);
  }

  console.log("\n✅ 트렌드 저장 완료:");
  allTrends
    .sort((a, b) => b.score - a.score)
    .forEach((t) => console.log(`  [${t.source}] ${t.keyword}: ${t.score}점`));
}

main().catch((err) => {
  console.error("오류:", err);
  process.exit(1);
});
