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
      .select("title, feedback_score, feedback_note, edited_title, edited_content, original_content")
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
      .or(`constitution_type.eq.${constitutionType},constitution_type.is.null`);

    if (error || !data || data.length === 0) {
      console.log("리서치 문서 없음. 기본 프롬프트 사용.");
      return [];
    }

    const selected = data.sort(() => Math.random() - 0.5).slice(0, 5);
    console.log(`리서치 문서 ${data.length}건 중 랜덤 ${selected.length}건 선택됨`);
    return selected;
  } catch (err) {
    console.warn("리서치 문서 로드 오류 (무시):", err.message);
    return [];
  }
}

// ── Supabase에서 최근 게시글 제목+요약 읽기 ──────────────────────────
async function fetchRecentPostSummaries(constitutionType) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("title, content")
      .eq("constitution_type", constitutionType)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) {
      console.log("기존 게시글 없음.");
      return [];
    }

    console.log(`기존 게시글 ${data.length}건 로드됨`);
    return data.map((p) => ({ title: p.title, summary: p.content.slice(0, 200) }));
  } catch (err) {
    console.warn("기존 게시글 로드 오류 (무시):", err.message);
    return [];
  }
}

// ── 제목 핵심 명사 추출 (2글자 이상 토큰) ────────────────────────────
function extractNouns(title) {
  return title
    .split(/\s+/)
    .map((t) => t.replace(/[^가-힣a-zA-Z0-9]/g, ""))
    .filter((t) => t.length >= 2);
}

// ── 제목 유사도 체크 ─────────────────────────────────────────────────
// 반환값: 유사한 기존 제목 문자열 (없으면 null)
function isTitleSimilar(newTitle, existingTitles) {
  const newNouns = extractNouns(newTitle);
  for (const existing of existingTitles) {
    // 조건 b: 포함 관계
    if (newTitle.includes(existing) || existing.includes(newTitle)) {
      return existing;
    }
    // 조건 a: 핵심 명사 3개 이상 겹침
    const existingNouns = extractNouns(existing);
    const overlap = newNouns.filter((n) => existingNouns.includes(n));
    if (overlap.length >= 3) {
      return existing;
    }
  }
  return null;
}

// ── 다른 체질 최근 게시글 제목 읽기 (교차 중복 방지용) ────────────────
async function fetchCrossConstitutionTitles(constitutionType) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("title")
      .neq("constitution_type", constitutionType)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      console.log("다른 체질 게시글 없음.");
      return [];
    }

    console.log(`다른 체질 게시글 ${data.length}건 로드됨`);
    return data.map((p) => p.title);
  } catch (err) {
    console.warn("다른 체질 게시글 로드 오류 (무시):", err.message);
    return [];
  }
}

// ── Claude로 콘텐츠 생성 ─────────────────────────────────────────────
async function generatePostContent(constitutionType, trends, feedbacks, researchDocs, existingPosts, crossTitles, isListicle = false) {
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
            const titleDiff = f.edited_title
              ? `\n  제목 수정 → 원본: "${f.title}" / 수정본: "${f.edited_title}"`
              : `\n  제목: "${f.title}"`;
            const contentDiff =
              f.edited_content && f.edited_content !== f.original_content
                ? `\n  본문 수정 →\n    [원본] ${f.original_content.slice(0, 150)}...\n    [수정본] ${f.edited_content.slice(0, 150)}...`
                : "";
            return `- ${score}${titleDiff}${note}${contentDiff}`;
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

  const existingPostsSection =
    existingPosts.length > 0
      ? `\n[절대 금지 — 기존 게시글과 중복 불가]\n` +
        `아래는 이미 발행된 게시글 목록이다. 이 글들과 주제, 소재, 핵심 메시지, 접근 방식이 단 1%라도 겹치면 안 된다.\n` +
        `유사한 키워드가 나온다면 완전히 다른 각도, 다른 사례, 다른 과학적 근거로 접근해야 한다.\n` +
        `기존 글을 "발전"시키거나 "보완"하는 것도 금지다. 완전히 새로운 주제를 골라라.\n\n` +
        existingPosts
          .map((p) => `- 제목: "${p.title}"\n  요약: ${p.summary}${p.summary.length >= 200 ? "..." : ""}`)
          .join("\n") +
        `\n\n위 목록에 없는 완전히 새로운 주제로만 작성할 것.\n`
      : "";

  const crossTitlesSection =
    crossTitles.length > 0
      ? `\n[체질 간 교차 중복 금지]\n` +
        `아래는 다른 체질로 이미 발행된 게시글 제목이다. 체질이 달라도 동일 주제는 금지다.\n` +
        crossTitles.map((t) => `- "${t}"`).join("\n") +
        `\n`
      : "";

  const listicleGuide = isListicle
    ? `
[리스티클 형식으로 작성]
- 제목은 반드시 "N가지", "TOP N", "N단계" 같은 숫자 포함 리스티클 형식으로 (예: "${constitutionType}에게 좋은 여름 음식 5가지", "${constitutionType} 수면 루틴 TOP 3")
- 숫자는 3~7 사이로 선택
- content는 각 항목을 "1. 항목명\\n설명" 형태로 구성 (번호. 항목명 한 줄 + 설명 1~2문장)
- 항목 간 구분은 빈 줄(\\n\\n)로
- 전체 분량 400-600자
`
    : `
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
`;

  const titleGuide = isListicle
    ? `"제목은 숫자 포함 리스티클 형식 (예: '${constitutionType}에게 좋은 음식 5가지', '${constitutionType} 건강 루틴 TOP 3') — 30자 이내"`
    : `"매력적이고 구체적인 제목 (30자 이내)"`;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `당신은 사상체질 전문가입니다. 오늘의 ${constitutionType} 이야기를 작성해주세요.
${trendSection}${feedbackSection}${researchSection}${existingPostsSection}${crossTitlesSection}
다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "title": ${titleGuide},
  "content": "본문 내용",
  "unsplash_query": "Unsplash 이미지 검색 키워드 (영어, 2-4단어, 이 글의 제목과 핵심 주제를 직접 반영한 구체적인 키워드 — 예: 글이 '항공 여행 피로 회복'이면 'airplane travel fatigue rest', '소화 약한 체질 따뜻한 음식'이면 'warm soup digestion comfort food')"
}

SEO/노출 최적화 지침:
- 크롤링된 트렌드 키워드를 제목과 첫 문단에 자연스럽게 포함
- 독자가 실제로 검색할 만한 키워드 중심으로 작성
${listicleGuide}
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

// ── 오늘 이미 생성된 포스트 확인 (draft/approved/published 모두 포함) ──
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
    .in("status", ["draft", "approved", "published"])
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

  // 0. 중복 생성 방지 (draft/approved/published 모두 체크)
  console.log("오늘 이미 생성된 포스트 확인 중...");
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

  // 4. 기존 게시글 제목+요약 로드 (중복 방지용)
  console.log("Supabase에서 기존 게시글 요약 로드 중...");
  const existingPosts = await fetchRecentPostSummaries(constitutionType);

  // 4b. 다른 체질 게시글 제목 로드 (교차 중복 방지용)
  console.log("Supabase에서 다른 체질 게시글 제목 로드 중...");
  const crossTitles = await fetchCrossConstitutionTitles(constitutionType);

  // 5. Claude로 콘텐츠 생성 (15% 확률로 리스티클 형식) + 제목 유사도 재시도
  const isListicle = Math.random() < 0.15;
  console.log(`\n콘텐츠 형식: ${isListicle ? "리스티클" : "일반"}`);

  const allExistingTitles = [
    ...existingPosts.map((p) => p.title),
    ...crossTitles,
  ];

  let generated = null;
  const MAX_RETRY = 3;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    console.log(`Claude API로 콘텐츠 생성 중... (시도 ${attempt}/${MAX_RETRY})`);
    const candidate = await generatePostContent(
      constitutionType,
      trends,
      feedbacks,
      researchDocs,
      existingPosts,
      crossTitles,
      isListicle
    );

    const similarTitle = isTitleSimilar(candidate.title, allExistingTitles);
    if (!similarTitle) {
      generated = candidate;
      break;
    }

    console.warn(`⚠ RETRY [${attempt}/${MAX_RETRY}]: 제목 유사 감지 → '${similarTitle}' / 재생성 중...`);
  }

  if (!generated) {
    console.error(`❌ ${MAX_RETRY}회 재시도 모두 실패 (${constitutionType}). 스킵합니다.`);
    process.exit(0);
  }

  const { title, content, unsplash_query } = generated;
  console.log(`제목: ${title}`);
  console.log(`Unsplash 쿼리: ${unsplash_query}`);

  // 6. Unsplash 이미지 가져오기
  console.log("\nUnsplash 이미지 검색 중...");
  const imageUrl = await fetchUnsplashImage(unsplash_query);
  console.log(`이미지 URL: ${imageUrl || "없음 (기본값 사용)"}`);

  // 7. Supabase에 draft로 저장
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
