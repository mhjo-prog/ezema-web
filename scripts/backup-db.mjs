// ============================================================
// scripts/backup-db.mjs
// Supabase 전 테이블 JSON 백업
// 실행: node --env-file=.env scripts/backup-db.mjs
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// ----------------------------------------------------------
// 환경변수 (fallback 순서)
// ----------------------------------------------------------
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "[backup] SUPABASE_URL / SUPABASE_SERVICE_KEY 환경변수가 없습니다."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ----------------------------------------------------------
// 백업 대상 테이블
// ----------------------------------------------------------
const TABLES = [
  "kakao_users",
  "scent_results",
  "quiz_results",
  "posts",
  "post_feedback",
  "wellness_posts",
  "wellness_post_feedback",
  "bookmarks",
  "analytics",
  "trends",
  "research_docs",
];

// ----------------------------------------------------------
// 출력 디렉터리
// ----------------------------------------------------------
const BACKUP_DIR = join(process.cwd(), "db-backup");
mkdirSync(BACKUP_DIR, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

console.log(`\n[backup] 시작 — ${new Date().toLocaleString("ko-KR")}`);
console.log(`[backup] 저장 위치: db-backup/\n`);

const summary = [];

for (const table of TABLES) {
  let allRows = [];
  let from = 0;
  const PAGE = 1000;

  // Supabase REST API는 최대 1000건 제한 → 페이지네이션
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE - 1);

    if (error) {
      // 테이블이 없으면 건너뜀
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.warn(`  [skip] ${table} — 테이블 없음`);
      } else {
        console.error(`  [error] ${table}: ${error.message}`);
      }
      break;
    }

    allRows = allRows.concat(data);
    if (data.length < PAGE) break; // 마지막 페이지
    from += PAGE;
  }

  if (allRows.length === 0 && !summary.find((s) => s.table === table)) {
    // 에러가 아닌 정상 빈 테이블도 기록
  }

  const filename = `${table}.json`;
  const filepath = join(BACKUP_DIR, filename);
  writeFileSync(filepath, JSON.stringify(allRows, null, 2), "utf-8");

  const count = allRows.length;
  summary.push({ table, count });
  console.log(`  ✓ ${table.padEnd(28)} ${String(count).padStart(6)}행  →  ${filename}`);
}

// 메타 파일 (백업 시각·건수 요약)
const meta = { timestamp, tables: summary };
writeFileSync(join(BACKUP_DIR, "_meta.json"), JSON.stringify(meta, null, 2));

console.log(`\n[backup] 완료 ─────────────────────────────────`);
console.log(`  총 ${summary.reduce((s, r) => s + r.count, 0)}행 백업`);
console.log(`  _meta.json 에 요약 저장\n`);
