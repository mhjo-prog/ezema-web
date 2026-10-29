// prerender.mjs
// 빌드 후 정적 라우트를 서버사이드 렌더링으로 pre-render
// react-helmet-async v3은 SSR에서 head 태그를 body에 인라인으로 렌더링하므로,
// 렌더링된 HTML에서 head 태그를 추출하여 <head>로 이동한다.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "dist");
const serverBundle = path.resolve(distDir, "server/entry-server.js");
// 원본 클라이언트 빌드 템플릿 백업 위치
const templateBackup = path.resolve(distDir, "_template.html");

// Pre-render할 정적 라우트 목록
const routes = ["/", "/test", "/sasang", "/wellness", "/about"];

/**
 * react-helmet-async v3는 SSR에서 head 태그를 HTML 맨 앞에 인라인으로 렌더링한다.
 * 이 함수는 HTML 앞부분에서 head 태그들을 추출하고 나머지 body HTML을 반환한다.
 */
function extractHeadTags(html) {
  // HTML 앞부분의 head 태그들을 순차적으로 소비
  const headTagRegex = /^(?:<(?:title|meta|link|base)[^>]*(?:\/>|>[^<]*<\/(?:title)>)|<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>)*/;
  const match = html.match(headTagRegex);

  if (!match || !match[0]) {
    return { headTags: "", bodyHtml: html };
  }

  const headTags = match[0];
  const bodyHtml = html.slice(headTags.length);
  return { headTags, bodyHtml };
}

async function prerender() {
  if (!fs.existsSync(serverBundle)) {
    console.error("❌ 서버 번들이 없습니다. 먼저 `npm run build:ssr`을 실행하세요.");
    process.exit(1);
  }

  // 원본 템플릿 확보: 백업이 없으면 현재 index.html을 백업으로 저장
  const indexPath = path.resolve(distDir, "index.html");
  if (!fs.existsSync(templateBackup)) {
    fs.copyFileSync(indexPath, templateBackup);
    console.log("📋 원본 템플릿 백업 저장됨");
  }
  const template = fs.readFileSync(templateBackup, "utf-8");

  // 서버 번들 import
  const { render } = await import(serverBundle);

  let count = 0;
  for (const url of routes) {
    try {
      const { html: rawHtml } = render(url);

      // body에서 head 태그 추출
      const { headTags, bodyHtml } = extractHeadTags(rawHtml);

      // <div id="root"> 안에 정제된 HTML 주입
      let page = template.replace(
        '<div id="root"></div>',
        `<div id="root">${bodyHtml}</div>`
      );

      if (headTags) {
        // 템플릿의 기본 title, meta description, og 태그 제거 (Helmet이 페이지별로 더 정확히 제공)
        page = page.replace(/<title[^>]*>.*?<\/title>/gs, "");
        page = page.replace(/<meta\s+name="description"[^>]*>/gi, "");
        page = page.replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, "");
        // 추출한 head 태그들을 </head> 앞에 삽입
        page = page.replace("</head>", `    ${headTags}\n  </head>`);
      }

      // 출력 경로: /test → dist/test/index.html
      const outputDir =
        url === "/" ? distDir : path.resolve(distDir, url.slice(1));
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, "index.html"), page, "utf-8");

      const tagCount = (headTags.match(/</g) || []).length;
      console.log(`✅ Pre-rendered: ${url} (head tags: ~${tagCount})`);
      count++;
    } catch (err) {
      console.error(`❌ Pre-render 실패 (${url}):`, err.message);
      console.error(err.stack?.split("\n").slice(1, 4).join("\n"));
    }
  }

  console.log(`\n🎉 Pre-render 완료: ${count}/${routes.length} 페이지`);
}

prerender();
