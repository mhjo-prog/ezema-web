// scripts/cleanup-drafts.js
// draft 상태 게시물 전부 삭제 (published/approved 유지)
// 로컬 실행: node scripts/cleanup-drafts.js

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 루트 .env 파일 로드 (dotenv 없이 직접 파싱)
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "../.env");
    const content = readFileSync(envPath, "utf8");
    const vars = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      vars[key] = value;
    }
    return vars;
  } catch {
    return {};
  }
}

const env = loadEnv();

const supabaseUrl =
  process.env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase URL 또는 키가 없습니다.");
  console.error("   .env 파일에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 확인하거나");
  console.error("   SUPABASE_SERVICE_KEY 환경변수를 설정하세요.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // 삭제 전 개수 확인
  const { data: drafts, error: countError } = await supabase
    .from("posts")
    .select("id, title, constitution_type, created_at")
    .eq("status", "draft")
    .order("created_at", { ascending: true });

  if (countError) {
    console.error("❌ 조회 오류:", countError.message);
    process.exit(1);
  }

  if (!drafts || drafts.length === 0) {
    console.log("✅ 삭제할 draft 게시물이 없습니다.");
    return;
  }

  console.log(`\n🗑️  삭제 예정 draft 게시물 (${drafts.length}개):`);
  drafts.forEach((p) => {
    const date = new Date(p.created_at).toLocaleDateString("ko-KR");
    console.log(`  - [${p.constitution_type}] ${p.title} (${date})`);
  });

  console.log("\n삭제를 진행합니다...");

  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("status", "draft");

  if (deleteError) {
    console.error("❌ 삭제 오류:", deleteError.message);
    if (deleteError.message.includes("policy")) {
      console.error("\n💡 RLS 정책으로 인해 anon 키로는 삭제가 안 될 수 있습니다.");
      console.error("   Supabase 대시보드 → Settings → API → service_role 키를 사용하세요:");
      console.error("   SUPABASE_SERVICE_KEY=<service_role_key> node scripts/cleanup-drafts.js");
    }
    process.exit(1);
  }

  console.log(`\n✅ ${drafts.length}개 draft 게시물 삭제 완료!`);
  console.log("   published/approved 게시물은 유지되었습니다.");
}

main().catch((err) => {
  console.error("오류:", err);
  process.exit(1);
});
