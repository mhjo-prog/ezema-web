// scripts/generate-post.js
// GitHub Actions에서 실행: 사상체질 카드뉴스 초안 생성 + Supabase 저장
// 트렌드 키워드를 Supabase trends 테이블에서 읽어 Claude 프롬프트에 반영

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const CONSTITUTION_TYPES = ["태양인", "태음인", "소양인", "소음인"];

// 오늘 날짜(UTC 기준 epoch 일수)를 4로 나눈 나머지로 체질 순환
function getTodayConstitutionType() {
  const dayIndex = Math.floor(Date.now() / 86400000) % CONSTITUTION_TYPES.length;
  return CONSTITUTION_TYPES[dayIndex];
}

// ── Supabase에서 최근 트렌드 키워드 읽기 ───────────────────────────
async function fetchRecentTrends() {
  try {
    const since = new Date();
    since.setHours(since.getHours() - 24); // 최근 24시간

    const { data, error } = await supabase
      .from("trends")
      .select("keyword, source, score")
      .gte("collected_at", since.toISOString())
      .order("score", { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) {
      console.log("트렌드 데이터 없음. 기본 프롬프트 사용.");
      return [];
    }

    console.log(`트렌드 키워드 ${data.length}개 로드됨:`);
    data.forEach((t) => console.log(`  [${t.source}] ${t.keyword} (${t.score}점)`));
    return data;
  } catch (err) {
    console.warn("트렌드 로드 오류 (무시):", err.message);
    return [];
  }
}

// ── Claude로 콘텐츠 생성 ─────────────────────────────────────────────
async function generatePostContent(constitutionType, trends) {
  const trendSection =
    trends.length > 0
      ? `\n요즘 많이 검색되는 건강 키워드: ${trends.map((t) => t.keyword).join(", ")}\n이 중 ${constitutionType}과 연결할 수 있는 키워드를 자연스럽게 녹여주세요.\n`
      : "";

  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `당신은 사상체질 전문가입니다. 오늘의 ${constitutionType} 이야기를 작성해주세요.
${trendSection}
다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "title": "매력적이고 구체적인 제목 (30자 이내)",
  "content": "본문 내용",
  "unsplash_query": "Unsplash 이미지 검색 키워드 (영어, 2-4단어, 이 글의 제목과 핵심 주제를 직접 반영한 구체적인 키워드 — 예: 글이 '항공 여행 피로 회복'이면 'airplane travel fatigue rest', '소화 약한 체질 따뜻한 음식'이면 'warm soup digestion comfort food')"
}

content 필드 작성 규칙:
- ##, **, >, - 같은 마크다운 기호 절대 사용 금지
- 일반 텍스트로만 작성, 단락 구분은 빈 줄(\\n\\n)로
- 자연스럽고 친근한 문체, 2~3개 단락으로 구성
- 300-500자 분량
- 해당 체질의 특성/생활습관/건강법/음식 중 하나를 주제로
- 독자가 실생활에 바로 적용할 수 있는 실용적인 내용

작성 예시:
태음인은 무엇이든 천천히, 깊게 받아들이는 체질입니다. 소화력이 강하고 체력도 좋지만, 그만큼 몸 안에 노폐물이 쌓이기 쉽습니다.

땀을 잘 흘리는 것이 태음인 건강의 핵심입니다. 규칙적인 유산소 운동으로 충분히 땀을 내면 몸이 한결 가벼워집니다. 등산이나 빠른 걷기를 추천합니다.

식사는 천천히, 80%만 먹는 습관을 들여보세요. 도라지, 율무, 현미처럼 폐를 돕는 식품이 태음인에게 잘 맞습니다.

${constitutionType}의 특성:
- 태음인: 소화력 강함, 땀을 많이 흘림, 폐 기능 약함, 끈기 있고 보수적, 간 기능 발달
- 소음인: 소화 약함, 추위 잘 탐, 신장 기능 발달, 꼼꼼하고 내성적, 비장 약함
- 태양인: 폐 기능 매우 발달, 간 기능 약함, 독창적이고 사교적, 소변이 많음
- 소양인: 비장 기능 발달, 신장 약함, 외향적이고 급한 성격, 열이 많음`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude 응답에서 JSON을 파싱할 수 없습니다.");
  return JSON.parse(jsonMatch[0]);
}

// ── Unsplash 이미지 가져오기 ─────────────────────────────────────────
async function fetchUnsplashImage(query) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.warn("UNSPLASH_ACCESS_KEY 없음. 기본 이미지 사용.");
    return null;
  }

  const res = await fetch(
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high`,
    { headers: { Authorization: `Client-ID ${accessKey}` } }
  );

  if (!res.ok) {
    console.warn(`Unsplash API 오류: ${res.status}`);
    return null;
  }

  const data = await res.json();
  return data.urls?.regular || data.urls?.full || null;
}

// ── 오늘 이미 생성된 draft 확인 ──────────────────────────────────────
async function checkAlreadyGenerated(constitutionType) {
  // KST(UTC+9) 기준 오늘 00:00을 UTC로 변환
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayStart = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate())
    - 9 * 60 * 60 * 1000
  );

  const { data, error } = await supabase
    .from("posts")
    .select("id")
    .eq("constitution_type", constitutionType)
    .eq("status", "draft")
    .gte("created_at", todayStart.toISOString())
    .limit(1);

  if (error) {
    console.warn("중복 확인 오류 (무시):", error.message);
    return false;
  }
  return data && data.length > 0;
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  const constitutionType = process.argv[2] || getTodayConstitutionType();
  console.log(`오늘의 체질 타입: ${constitutionType}\n`);

  // 0. 중복 생성 방지
  console.log("오늘 이미 생성된 draft 확인 중...");
  const alreadyGenerated = await checkAlreadyGenerated(constitutionType);
  if (alreadyGenerated) {
    console.log(`오늘 이미 생성됨 (${constitutionType}), 스킵`);
    process.exit(0);
  }

  // 1. 트렌드 키워드 로드 (없어도 계속 진행)
  console.log("Supabase에서 최근 트렌드 로드 중...");
  const trends = await fetchRecentTrends();

  // 2. Claude로 콘텐츠 생성
  console.log("\nClaude API로 콘텐츠 생성 중...");
  const { title, content, unsplash_query } = await generatePostContent(
    constitutionType,
    trends
  );
  console.log(`제목: ${title}`);
  console.log(`Unsplash 쿼리: ${unsplash_query}`);

  // 3. Unsplash 이미지 가져오기
  console.log("\nUnsplash 이미지 검색 중...");
  const imageUrl = await fetchUnsplashImage(unsplash_query);
  console.log(`이미지 URL: ${imageUrl || "없음 (기본값 사용)"}`);

  // 4. Supabase에 draft로 저장
  console.log("\nSupabase에 저장 중...");
  const { data, error } = await supabase.from("posts").insert({
    title,
    content,
    card_image_url: imageUrl || "",
    constitution_type: constitutionType,
    status: "draft",
    scheduled_at: null,
  });

  if (error) {
    console.error("Supabase 저장 오류:", error);
    process.exit(1);
  }

  console.log("✅ 포스트 초안 생성 완료!");
  console.log(data);
}

main().catch((err) => {
  console.error("오류:", err);
  process.exit(1);
});
