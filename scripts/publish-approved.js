// scripts/publish-approved.js
// GitHub Actions에서 실행: approved 상태 포스트를 published로 전환

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  const now = new Date().toISOString();
  let totalPublished = 0;

  // 사상체질 포스트
  console.log("사상체질 승인된 포스트를 published로 전환 중...");
  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .update({ status: "published" })
    .eq("status", "approved")
    .lte("scheduled_at", now)
    .select();

  if (postsError) {
    console.error("posts Supabase 오류:", postsError);
    process.exit(1);
  }

  if (postsData && postsData.length > 0) {
    console.log(`✅ 사상체질 ${postsData.length}개 포스트 게시 완료:`);
    postsData.forEach((p) => console.log(`  - [${p.constitution_type}] ${p.title}`));
    totalPublished += postsData.length;
  } else {
    console.log("게시할 사상체질 승인된 포스트가 없습니다.");
  }

  // 웰니스 포스트
  console.log("웰니스 승인된 포스트를 published로 전환 중...");
  const { data: wellnessData, error: wellnessError } = await supabase
    .from("wellness_posts")
    .update({ status: "published" })
    .eq("status", "approved")
    .lte("scheduled_at", now)
    .select();

  if (wellnessError) {
    console.error("wellness_posts Supabase 오류:", wellnessError);
    process.exit(1);
  }

  if (wellnessData && wellnessData.length > 0) {
    console.log(`✅ 웰니스 ${wellnessData.length}개 포스트 게시 완료:`);
    wellnessData.forEach((p) => console.log(`  - [${p.wellness_category}] ${p.title}`));
    totalPublished += wellnessData.length;
  } else {
    console.log("게시할 웰니스 승인된 포스트가 없습니다.");
  }

  console.log(`\n총 ${totalPublished}개 포스트 게시 완료.`);
}

main().catch((err) => {
  console.error("오류:", err);
  process.exit(1);
});
