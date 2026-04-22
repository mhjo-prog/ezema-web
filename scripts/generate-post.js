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

// ── Supabase에서 이전 피드백 읽기 ────────────────────────────────────
async function fetchRecentFeedback(constitutionType) {
  try {
    const { data, error } = await supabase
      .from("post_feedback")
      .select("title, feedback_score, feedback_note, edited_content, original_content")
      .eq("constitution_type", constitutionType)
      .not("feedback_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) {
      console.log("이전 피드백 없음. 기본 프롬프트 사용.");
      return [];
    }

    console.log(`이전 피드백 ${data.length}건 로드됨`);
    return data;
  } catch (err) {
    console.warn("피드백 로드 오류 (무시):", err.message);
    return [];
  }
}

// ── Supabase에서 리서치 문서 읽기 ────────────────────────────────────
async function fetchResearchDocs(constitutionType) {
  try {
    const { data, error } = await supabase
      .from("research_docs")
      .select("title, category, content")
      .or(`constitution_type.eq.${constitutionType},constitution_type.is.null`)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) {
      console.log("리서치 문서 없음. 기본 프롬프트 사용.");
      return [];
    }

    console.log(`리서치 문서 ${data.length}건 로드됨`);
    return data;
  } catch (err) {
    console.warn("리서치 문서 로드 오류 (무시):", err.message);
    return [];
  }
}

// ── Claude로 콘텐츠 생성 ─────────────────────────────────────────────
async function generatePostContent(constitutionType, trends, feedbacks, researchDocs) {
  const trendSection =
    trends.length > 0
      ? `\n요즘 많이 검색되는 건강 키워드: ${trends.map((t) => t.keyword).join(", ")}\n이 중 ${constitutionType}과 연결할 수 있는 키워드를 자연스럽게 녹여주세요.\n`
      : "";

  const feedbackSection =
    feedbacks.length > 0
      ? `\n[이전 게시물 피드백 참고]\n` +
        feedbacks
          .map((f) => {
            const score = `점수: ${f.feedback_score}/5`;
            const note = f.feedback_note ? `\n  메모: ${f.feedback_note}` : "";
            const diff =
              f.edited_content && f.edited_content !== f.original_content
                ? `\n  수정됨 (원본과 다름)`
                : "";
            return `- 제목: "${f.title}"\n  ${score}${note}${diff}`;
          })
          .join("\n") +
        `\n점수가 낮거나 수정이 많았던 글의 패턴을 피하고, 높은 평가를 받은 스타일을 참고해서 작성해주세요.\n`
      : "";

  const researchSection =
    researchDocs.length > 0
      ? `\n[참고 리서치 자료]\n` +
        researchDocs
          .map((d) => {
            const category = d.category ? ` [${d.category}]` : "";
            return `- 제목: "${d.title}"${category}\n  내용: ${d.content.slice(0, 300)}${d.content.length > 300 ? "..." : ""}`;
          })
          .join("\n") +
        `\n위 자료를 단순 인용하지 말고, 핵심 인사이트를 현대적 시각으로 재해석해서 독자가 처음 듣는 것처럼 신선하게 풀어써줘.\n`
      : "";

  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `당신은 사상체질 전문가입니다. 오늘의 ${constitutionType} 이야기를 작성해주세요.
${trendSection}${feedbackSection}${researchSection}
다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "title": "매력적이고 구체적인 제목 (30자 이내)",
  "content": "본문 내용",
  "image_keywords": "이 글의 핵심 시각 요소 2~3개 (영어로, 쉼표로 구분. 예: '항공 여행 피로'이면 'airplane seat, tired traveler, window view', '소화 따뜻한 음식'이면 'warm soup bowl, gentle steam, wooden table')",
  "characters": ["dad"]
}

characters 선택 규칙:
- 가족 이야기, 집 안 장면 → dad, mom 중심
- 젊은 세대, 운동, 활동적인 내용 → brother, sister 중심
- 일상 산책, 힐링, 자연 → dog 포함
- 1~2개 선택, 배열로 작성 (예: ["dad"], ["mom", "sister"], ["dad", "dog"])
- 반드시 brother/dad/dog/mom/sister 중에서만 선택

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

// ── GPT-4o Image (gpt-image-1) 이미지 생성 ───────────────────────────
const STORAGE_BASE =
  "https://gziaqastmqrhhmhvhlej.supabase.co/storage/v1/object/public/post-images";

const CHARACTER_URLS = {
  brother: `${STORAGE_BASE}/char-brother.png`,
  dad: `${STORAGE_BASE}/char-dad.png`,
  dog: `${STORAGE_BASE}/char-dog.png`,
  mom: `${STORAGE_BASE}/char-mom.png`,
  sister: `${STORAGE_BASE}/char-sister.png`,
};

const IMAGE_STYLE_PROMPT =
  "A black-and-white hand-drawn illustration in a rough pencil sketch style, warm and emotional tone, soft graphite pencil on textured paper, slightly messy and imperfect lines, minimal but expressive. Korean Sasang constitution wellness theme.";

async function generateGptImage(title, imageKeywords, characters) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY 없음. 기본 이미지 사용.");
    return null;
  }

  const validChars = (characters || []).filter((c) => CHARACTER_URLS[c]);
  const selectedChars = validChars.length > 0 ? validChars : ["dad"];
  console.log(`선택된 캐릭터: ${selectedChars.join(", ")}`);

  const prompt = `${IMAGE_STYLE_PROMPT} Theme: ${title}. Key visual elements: ${imageKeywords}. Use the provided character reference images to maintain consistent character appearance and style.`;
  console.log(`GPT-Image 프롬프트: ${prompt.slice(0, 120)}...`);

  try {
    // 선택된 캐릭터 레퍼런스 이미지 다운로드
    const formData = new FormData();
    for (const charName of selectedChars) {
      const imgRes = await fetch(CHARACTER_URLS[charName]);
      if (!imgRes.ok) {
        console.warn(`캐릭터 이미지 다운로드 실패: ${charName}`);
        continue;
      }
      const buffer = await imgRes.arrayBuffer();
      const blob = new Blob([buffer], { type: "image/png" });
      formData.append("image[]", blob, `${charName}.png`);
    }

    formData.append("model", "gpt-image-1");
    formData.append("prompt", prompt);
    formData.append("size", "1024x1024");
    formData.append("n", "1");

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`GPT-Image API 오류: ${res.status} - ${errText}`);
      return null;
    }

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) {
      console.warn("GPT-Image 응답에 데이터 없음.");
      return null;
    }

    // base64 → Buffer → Supabase Storage 업로드
    const imgBuffer = Buffer.from(b64, "base64");
    const fileName = `post-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(fileName, imgBuffer, { contentType: "image/png", upsert: false });

    if (uploadError) {
      console.warn("Supabase Storage 업로드 실패:", uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(fileName);
    console.log(`Supabase Storage 저장 완료: ${urlData?.publicUrl}`);
    return urlData?.publicUrl || null;
  } catch (err) {
    console.warn("GPT-Image 생성 오류:", err.message);
    return null;
  }
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

  // 2. 이전 피드백 로드 (없어도 계속 진행)
  console.log("Supabase에서 이전 피드백 로드 중...");
  const feedbacks = await fetchRecentFeedback(constitutionType);

  // 3. 리서치 문서 로드 (없어도 계속 진행)
  console.log("Supabase에서 리서치 문서 로드 중...");
  const researchDocs = await fetchResearchDocs(constitutionType);

  // 4. Claude로 콘텐츠 생성
  console.log("\nClaude API로 콘텐츠 생성 중...");
  const { title, content, image_keywords, characters } = await generatePostContent(
    constitutionType,
    trends,
    feedbacks,
    researchDocs
  );
  console.log(`제목: ${title}`);
  console.log(`이미지 키워드: ${image_keywords}`);

  // 5. GPT-4o Image 생성
  console.log("\nGPT-4o Image 생성 중...");
  const imageUrl = await generateGptImage(title, image_keywords, characters);
  console.log(`이미지 URL: ${imageUrl || "없음 (기본값 사용)"}`);

  // 6. Supabase에 draft로 저장
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
