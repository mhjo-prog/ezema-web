// scripts/generate-wellness-post.js
// GitHub Actions에서 실행: 웰니스 카드뉴스 초안 생성 + Supabase 저장
// 트렌드 키워드를 Supabase trends 테이블에서 읽어 Claude 프롬프트에 반영

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const WELLNESS_CATEGORIES = ["수면", "식단", "운동", "명상", "스트레스"];

// 오늘 날짜(UTC 기준 epoch 일수)를 5로 나눈 나머지로 카테고리 순환
function getTodayWellnessCategory() {
  const dayIndex = Math.floor(Date.now() / 86400000) % WELLNESS_CATEGORIES.length;
  return WELLNESS_CATEGORIES[dayIndex];
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

// ── Claude로 웰니스 콘텐츠 생성 ─────────────────────────────────────
async function generateWellnessPostContent(category, trends) {
  const trendSection =
    trends.length > 0
      ? `\n요즘 많이 검색되는 건강 키워드: ${trends.map((t) => t.keyword).join(", ")}\n이 중 '${category}'와 연결할 수 있는 키워드를 자연스럽게 녹여주세요.\n`
      : "";

  const categoryGuide = {
    수면: "수면의 질, 수면 루틴, 불면증 예방, 깊은 잠을 위한 생활 습관",
    식단: "균형 잡힌 식사, 건강한 식재료, 영양소, 식사 습관, 간편하게 실천하는 건강 식단",
    운동: "일상 속 운동 루틴, 스트레칭, 유산소·근력 운동, 운동 동기 부여",
    명상: "마음 챙김, 호흡법, 명상 루틴, 감정 조절, 집중력 향상",
    스트레스: "스트레스 해소법, 번아웃 예방, 긴장 완화, 심리적 회복력",
  };

  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `당신은 현대인의 건강한 삶을 돕는 웰니스 전문가입니다. 오늘의 '${category}' 웰니스 이야기를 작성해주세요.
${trendSection}
카테고리 주제 범위: ${categoryGuide[category]}

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "title": "매력적이고 구체적인 제목 (30자 이내)",
  "content": "본문 내용",
  "unsplash_query": "Unsplash 이미지 검색 키워드 (영어, 2-4단어, 이 글의 핵심 주제를 직접 반영한 구체적인 키워드 — 예: '수면 루틴'이면 'peaceful sleep bedroom', '스트레칭 루틴'이면 'morning stretch yoga')"
}

content 필드 작성 규칙:
- ##, **, >, - 같은 마크다운 기호 절대 사용 금지
- 일반 텍스트로만 작성, 단락 구분은 빈 줄(\\n\\n)로
- 자연스럽고 친근한 문체, 2~3개 단락으로 구성
- 300-500자 분량
- 독자가 오늘부터 실생활에 바로 적용할 수 있는 실용적인 내용
- 너무 의학적이거나 딱딱하지 않게, 친구처럼 조언하는 톤

작성 예시 (수면 카테고리):
잠들기 전 스마트폰을 내려놓는 것만으로도 수면의 질이 달라집니다. 블루라이트는 뇌가 낮이라고 착각하게 만들어 수면 호르몬인 멜라토닌 분비를 방해하거든요.

잠들기 1시간 전부터는 조명을 낮추고, 따뜻한 물로 샤워하거나 가벼운 스트레칭을 해보세요. 몸이 '이제 잘 시간이구나'라고 신호를 받게 됩니다.

오늘 밤 딱 하나만 실천해 보세요. 침대에 눕기 30분 전, 스마트폰 대신 좋아하는 책 한 페이지를 펼치는 것. 작은 변화가 더 깊은 잠으로 이어집니다.`,
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
async function checkAlreadyGenerated(category) {
  // KST(UTC+9) 기준 오늘 00:00을 UTC로 변환
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayStart = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate())
    - 9 * 60 * 60 * 1000
  );

  const { data, error } = await supabase
    .from("wellness_posts")
    .select("id")
    .eq("wellness_category", category)
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
  const category = process.argv[2] || getTodayWellnessCategory();
  console.log(`오늘의 웰니스 카테고리: ${category}\n`);

  // 0. 중복 생성 방지
  console.log("오늘 이미 생성된 draft 확인 중...");
  const alreadyGenerated = await checkAlreadyGenerated(category);
  if (alreadyGenerated) {
    console.log(`오늘 이미 생성됨 (${category}), 스킵`);
    process.exit(0);
  }

  // 1. 트렌드 키워드 로드 (없어도 계속 진행)
  console.log("Supabase에서 최근 트렌드 로드 중...");
  const trends = await fetchRecentTrends();

  // 2. Claude로 콘텐츠 생성
  console.log("\nClaude API로 웰니스 콘텐츠 생성 중...");
  const { title, content, unsplash_query } = await generateWellnessPostContent(
    category,
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
  const { data, error } = await supabase.from("wellness_posts").insert({
    title,
    content,
    card_image_url: imageUrl || "",
    wellness_category: category,
    status: "draft",
    scheduled_at: null,
  });

  if (error) {
    console.error("Supabase 저장 오류:", error);
    process.exit(1);
  }

  console.log("✅ 웰니스 포스트 초안 생성 완료!");
  console.log(data);
}

main().catch((err) => {
  console.error("오류:", err);
  process.exit(1);
});
