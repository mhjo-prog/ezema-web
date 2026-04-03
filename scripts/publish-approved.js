// scripts/publish-approved.js
// GitHub Actions에서 실행: approved 상태 포스트를 published로 전환

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  console.log("승인된 포스트를 published로 전환 중...");

  const { data, error } = await supabase
    .from("posts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("status", "approved")
    .select();

  if (error) {
    console.error("Supabase 오류:", error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("게시할 승인된 포스트가 없습니다.");
    return;
  }

  console.log(`✅ ${data.length}개 포스트 게시 완료:`);
  data.forEach((p) => console.log(`  - [${p.constitution_type}] ${p.title}`));
}

main().catch((err) => {
  console.error("오류:", err);
  process.exit(1);
});
