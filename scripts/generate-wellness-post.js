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

// ── 달램 뉴스레터 설정 ───────────────────────────────────────────────
const DALLEM_KNOWN_NO = 95;  // 알려진 번호 — 새 호가 확인되면 여기만 올림
const DALLEM_FETCH_COUNT = 5;

// 오늘 날짜(UTC 기준 epoch 일수)를 5로 나눈 나머지로 카테고리 순환
function getTodayWellnessCategory() {
  const dayIndex = Math.floor(Date.now() / 86400000) % WELLNESS_CATEGORIES.length;
  return WELLNESS_CATEGORIES[dayIndex];
}

// ── 달램 최신 번호 자동 탐지 ─────────────────────────────────────────
async function detectDallemLatestNo() {
  let no = DALLEM_KNOWN_NO;
  while (true) {
    try {
      const res = await fetch(`https://dallem.stibee.com/p/${no + 1}`, {
        method: "HEAD",
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        no++;
        console.log(`달램 #${no} 존재 확인, 계속 탐색...`);
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  console.log(`달램 최신 번호: #${no}`);
  return no;
}

// ── 달램 뉴스레터 크롤링 ─────────────────────────────────────────────
async function fetchDallemNewsletters() {
  const latestNo = await detectDallemLatestNo();
  const results = [];
  for (let no = latestNo; no > latestNo - DALLEM_FETCH_COUNT; no--) {
    try {
      const res = await fetch(`https://dallem.stibee.com/p/${no}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        console.log(`달램 #${no} 접근 실패 (${res.status}), skip`);
        continue;
      }
      const html = await res.text();

      // 제목: <title> 태그
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim().replace(/\s*[-|].*$/, "").trim() : `달램 #${no}`;

      // 본문: <body> 내 텍스트에서 태그 제거 후 앞 600자
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const bodyText = bodyMatch
        ? bodyMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : "";
      const summary = bodyText.slice(0, 600);

      if (summary.length > 50) {
        results.push({ no, title, summary });
        console.log(`달램 #${no} 수집 완료: "${title}"`);
      }
    } catch (err) {
      console.log(`달램 #${no} 크롤링 오류 (skip): ${err.message}`);
    }
  }
  return results;
}

// ── 네이버/헬스조선 웰니스 뉴스 크롤링 ──────────────────────────────
async function fetchWellnessNews() {
  const results = [];

  // 1. 헬스조선 RSS
  try {
    const res = await fetch("https://health.chosun.com/rss/index.rss", {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const xml = await res.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
      for (const [, itemXml] of items.slice(0, 5)) {
        const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
        const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        const summary = descMatch
          ? descMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 200)
          : "";
        if (title) {
          results.push({ source: "헬스조선", title, summary });
          console.log(`  헬스조선 수집: "${title}"`);
        }
      }
    }
  } catch (err) {
    console.warn("헬스조선 RSS 오류 (skip):", err.message);
  }

  // 2. 네이버 뉴스 검색
  try {
    const res = await fetch(
      `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent("웰니스")}`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (res.ok) {
      const html = await res.text();
      // 제목: title 속성 또는 태그 내 텍스트
      const titleRe = /class="news_tit"[^>]*(?:title="([^"]+)"|>([^<]{5,80}))<\/a>/g;
      const descRe = /class="(?:dsc_wrap|api_txt_lines)[^"]*"[^>]*>\s*(?:<[^>]+>)?([^<]{20,200})/g;
      const titles = [];
      const descs = [];
      let m;
      while ((m = titleRe.exec(html)) !== null && titles.length < 5) {
        const t = (m[1] || m[2] || "").trim();
        if (t) titles.push(t);
      }
      while ((m = descRe.exec(html)) !== null && descs.length < 5) {
        const d = m[1].replace(/&[a-z]+;/g, " ").trim();
        if (d.length > 20) descs.push(d);
      }
      for (let i = 0; i < titles.length; i++) {
        results.push({ source: "네이버뉴스", title: titles[i], summary: descs[i] || "" });
        console.log(`  네이버뉴스 수집: "${titles[i]}"`);
      }
    }
  } catch (err) {
    console.warn("네이버 뉴스 크롤링 오류 (skip):", err.message);
  }

  return results;
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

// ── Supabase에서 최근 게시글 제목+요약 읽기 ──────────────────────────
async function fetchRecentPostSummaries(category) {
  try {
    const { data, error } = await supabase
      .from("wellness_posts")
      .select("title, content")
      .eq("wellness_category", category)
      .order("created_at", { ascending: false })
      .limit(30);

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

// ── Claude로 웰니스 콘텐츠 생성 ─────────────────────────────────────
// externalRef: { source: "dallem"|"news", items: [{title, summary, source?}] } | null
async function generateWellnessPostContent(category, trends, existingPosts, externalRef) {
  let externalSection = "";
  if (externalRef && externalRef.items.length > 0) {
    if (externalRef.source === "dallem") {
      externalSection =
        `[달램 웰니스 뉴스레터 최신 트렌드 참고]\n아래 최신 웰니스 트렌드를 참고해서, 웰니스 관점으로 재해석하고 연결해서 작성해줘.\n` +
        externalRef.items
          .map((n) => `- 제목: "${n.title}"\n  내용 요약: ${n.summary}${n.summary.length >= 600 ? "..." : ""}`)
          .join("\n") +
        "\n";
    } else {
      externalSection =
        `[최신 웰니스 뉴스 트렌드 참고]\n아래 최신 웰니스 뉴스를 참고해서, 오늘의 주제와 연결해서 작성해줘.\n` +
        externalRef.items
          .map((n) => `- [${n.source}] 제목: "${n.title}"${n.summary ? `\n  요약: ${n.summary}` : ""}`)
          .join("\n") +
        "\n";
    }
  }

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

  const existingPostsSection =
    existingPosts.length > 0
      ? `\n[기존 게시글 — 중복 금지]\n` +
        existingPosts
          .map((p) => `- 제목: "${p.title}"\n  요약: ${p.summary}${p.summary.length >= 200 ? "..." : ""}`)
          .join("\n") +
        `\n아래 기존 게시글과 주제, 소재, 핵심 메시지가 겹치지 않도록 완전히 새로운 각도로 작성해줘.\n`
      : "";

  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `당신은 현대인의 건강한 삶을 돕는 웰니스 전문가입니다. 오늘의 '${category}' 웰니스 이야기를 작성해주세요.
${externalSection}${trendSection}
카테고리 주제 범위: ${categoryGuide[category]}
${existingPostsSection}
다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "title": "매력적이고 구체적인 제목 (30자 이내)",
  "content": "본문 내용",
  "unsplash_query": "Unsplash 이미지 검색 키워드 (영어, 2-4단어, 이 글의 핵심 주제를 직접 반영한 구체적인 키워드 — 예: '수면 루틴'이면 'peaceful sleep bedroom', '스트레칭 루틴'이면 'morning stretch yoga')"
}

SEO/노출 최적화 지침:
- 제목은 "~하는 법", "~의 이유", "~가 중요한 이유" 같은 검색 노출에 유리한 구체적인 표현 사용
- 크롤링된 트렌드 키워드를 제목과 첫 문단에 자연스럽게 포함
- 독자가 실제로 검색할 만한 키워드 중심으로 작성

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

  // 1. 외부 참고 소스 크롤링 — 50% 달램 / 50% 네이버+헬스조선 (없어도 계속 진행)
  let externalRef = null;
  if (Math.random() < 0.5) {
    console.log("달램 뉴스레터 크롤링 중... (50% 확률 선택)");
    const items = await fetchDallemNewsletters();
    console.log(`달램 뉴스레터 ${items.length}건 수집됨`);
    if (items.length > 0) externalRef = { source: "dallem", items };
  } else {
    console.log("웰니스 뉴스 크롤링 중... (50% 확률 선택)");
    const items = await fetchWellnessNews();
    console.log(`웰니스 뉴스 ${items.length}건 수집됨`);
    if (items.length > 0) externalRef = { source: "news", items };
  }
  if (!externalRef) console.log("외부 참고 소스 없음 — 기본 트렌드만 사용\n");

  // 2. 트렌드 키워드 로드 (없어도 계속 진행)
  console.log("Supabase에서 최근 트렌드 로드 중...");
  const trends = await fetchRecentTrends();

  // 3. 기존 게시글 제목+요약 로드 (중복 방지용)
  console.log("Supabase에서 기존 게시글 요약 로드 중...");
  const existingPosts = await fetchRecentPostSummaries(category);

  // 4. Claude로 콘텐츠 생성
  console.log("\nClaude API로 웰니스 콘텐츠 생성 중...");
  const { title, content, unsplash_query } = await generateWellnessPostContent(
    category,
    trends,
    existingPosts,
    externalRef
  );
  console.log(`제목: ${title}`);
  console.log(`Unsplash 쿼리: ${unsplash_query}`);

  // 5. Unsplash 이미지 가져오기
  console.log("\nUnsplash 이미지 검색 중...");
  const imageUrl = await fetchUnsplashImage(unsplash_query);
  console.log(`이미지 URL: ${imageUrl || "없음 (기본값 사용)"}`);

  // 6. Supabase에 draft로 저장
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
