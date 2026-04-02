// scripts/generate-post.js
// GitHub Actions에서 실행: 사상체질 카드뉴스 초안 생성 + Supabase 저장

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const CONSTITUTION_TYPES = ["태음인", "소음인", "태양인", "소양인"];

// 오늘 날짜 기준으로 체질 타입 순환 (매일 다른 체질)
function getTodayConstitutionType() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return CONSTITUTION_TYPES[dayOfYear % CONSTITUTION_TYPES.length];
}

async function generatePostContent(constitutionType) {
  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `당신은 사상체질 전문가입니다. 오늘의 ${constitutionType} 이야기를 카드뉴스 형식으로 작성해주세요.

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "title": "매력적이고 구체적인 제목 (30자 이내)",
  "content": "본문 내용 (300-500자, 해당 체질의 특성/생활습관/건강법/음식 중 하나를 주제로. 독자가 실생활에 바로 적용할 수 있는 실용적인 내용. 단락 구분 포함)",
  "unsplash_query": "Unsplash 이미지 검색 키워드 (영어, 2-3단어, 한국 전통의학/자연/건강/음식 관련)"
}

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

async function fetchUnsplashImage(query) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.warn("UNSPLASH_ACCESS_KEY 없음. 기본 이미지 사용.");
    return null;
  }

  const res = await fetch(
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high`,
    {
      headers: { Authorization: `Client-ID ${accessKey}` },
    }
  );

  if (!res.ok) {
    console.warn(`Unsplash API 오류: ${res.status}`);
    return null;
  }

  const data = await res.json();
  // 1280px 폭 이미지 URL 사용
  return data.urls?.regular || data.urls?.full || null;
}

async function main() {
  const constitutionType = getTodayConstitutionType();
  console.log(`오늘의 체질 타입: ${constitutionType}`);

  // 1. Claude로 콘텐츠 생성
  console.log("Claude API로 콘텐츠 생성 중...");
  const { title, content, unsplash_query } = await generatePostContent(constitutionType);
  console.log(`제목: ${title}`);
  console.log(`Unsplash 쿼리: ${unsplash_query}`);

  // 2. Unsplash 이미지 가져오기
  console.log("Unsplash 이미지 검색 중...");
  const imageUrl = await fetchUnsplashImage(unsplash_query);
  console.log(`이미지 URL: ${imageUrl || "없음 (기본값 사용)"}`);

  // 3. Supabase에 draft로 저장
  console.log("Supabase에 저장 중...");
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
