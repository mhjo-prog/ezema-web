/**
 * STEP 6 검증 스크립트
 * - 20문항 응답 5000회 랜덤 샘플링
 * - 결과 조합(축 + 상위 2향) 종류 수 및 점유율
 * - 향별 추천 횟수
 * - 케이스 A/B/C 검증
 */

// ── 데이터 인라인 정의 (TS import 없이 ESM으로 직접 구현) ──

const AXIS_FACETS = {
  숙면: ["onset", "maintain", "morning", "rhythm"],
  이완: ["emotional", "physical", "autonomic", "recovery"],
  활력: ["afternoon", "wakeup", "fatigue", "caffeine"],
  몰입: ["duration", "distract", "switch", "screen"],
  청정: ["airway", "sensitive", "stuffy", "hygiene"],
};

const FACET_LABELS = {
  onset:     "잠들기까지 오래 걸리는 점",
  maintain:  "자주 깨는 수면",
  morning:   "개운하지 않은 기상",
  rhythm:    "불규칙한 수면 리듬",
  physical:  "어깨·목의 긴장",
  emotional: "예민해진 감정",
  autonomic: "두근거림과 답답한 호흡",
  recovery:  "풀리지 않는 긴장",
  afternoon: "오후의 에너지 저하",
  wakeup:    "힘든 아침 기상",
  fatigue:   "설명되지 않는 몸의 무거움",
  caffeine:  "카페인 의존",
  duration:  "짧아진 집중 지속 시간",
  distract:  "잦은 주의 분산",
  switch:    "잦은 멀티태스킹",
  screen:    "긴 화면 사용 시간",
  airway:    "코막힘·목 간지러움",
  sensitive: "미세먼지에 민감한 컨디션",
  stuffy:    "답답한 실내 공기",
  hygiene:   "부족한 환기",
};

// 문항 → 축 + facet 매핑
const questions = [
  { id: 1, axis: "숙면", facet: "onset" },
  { id: 2, axis: "숙면", facet: "maintain" },
  { id: 3, axis: "숙면", facet: "morning" },
  { id: 4, axis: "숙면", facet: "rhythm" },
  { id: 5, axis: "이완", facet: "emotional" },
  { id: 6, axis: "이완", facet: "physical" },
  { id: 7, axis: "이완", facet: "autonomic" },
  { id: 8, axis: "이완", facet: "recovery" },
  { id: 9, axis: "활력", facet: "afternoon" },
  { id: 10, axis: "활력", facet: "wakeup" },
  { id: 11, axis: "활력", facet: "fatigue" },
  { id: 12, axis: "활력", facet: "caffeine" },
  { id: 13, axis: "몰입", facet: "duration" },
  { id: 14, axis: "몰입", facet: "distract" },
  { id: 15, axis: "몰입", facet: "switch" },
  { id: 16, axis: "몰입", facet: "screen" },
  { id: 17, axis: "청정", facet: "hygiene" },
  { id: 18, axis: "청정", facet: "sensitive" },
  { id: 19, axis: "청정", facet: "airway" },
  { id: 20, axis: "청정", facet: "stuffy" },
];

const scents = [
  // 숙면
  { id: "lavender-sleep",   nameKo: "라벤더",        axis: "숙면", profile: { onset:90, maintain:75, morning:60, rhythm:80 },  rarity: "common" },
  { id: "cedarwood",        nameKo: "시더우드",       axis: "숙면", profile: { onset:85, maintain:90, morning:55, rhythm:60 },  rarity: "uncommon" },
  { id: "bergamot-sleep",   nameKo: "베르가못",       axis: "숙면", profile: { onset:70, maintain:60, morning:70, rhythm:90 },  rarity: "common" },
  { id: "roman-chamomile",  nameKo: "로만 캐모마일",  axis: "숙면", profile: { onset:75, maintain:65, morning:50, rhythm:65 },  rarity: "uncommon" },
  { id: "sweet-orange-sleep",nameKo:"스위트오렌지",   axis: "숙면", profile: { onset:55, maintain:45, morning:80, rhythm:60 },  rarity: "common" },
  // 이완
  { id: "patchouli",        nameKo: "파촐리",         axis: "이완", profile: { physical:85, emotional:65, autonomic:95, recovery:80 }, rarity: "uncommon" },
  { id: "neroli",           nameKo: "네롤리",         axis: "이완", profile: { physical:60, emotional:95, autonomic:80, recovery:70 }, rarity: "rare" },
  { id: "bergamot",         nameKo: "베르가못",       axis: "이완", profile: { physical:65, emotional:90, autonomic:85, recovery:75 }, rarity: "common" },
  { id: "frankincense",     nameKo: "프랑킨센스",     axis: "이완", profile: { physical:75, emotional:75, autonomic:70, recovery:95 }, rarity: "uncommon" },
  { id: "lavender-relax",   nameKo: "라벤더",         axis: "이완", profile: { physical:80, emotional:80, autonomic:75, recovery:70 }, rarity: "common" },
  { id: "sweet-orange",     nameKo: "스위트오렌지",   axis: "이완", profile: { physical:50, emotional:80, autonomic:65, recovery:60 }, rarity: "common" },
  // 활력
  { id: "black-pepper",     nameKo: "블랙페퍼",       axis: "활력", profile: { afternoon:85, wakeup:80, fatigue:75, caffeine:95 }, rarity: "rare" },
  { id: "grapefruit",       nameKo: "자몽",           axis: "활력", profile: { afternoon:95, wakeup:75, fatigue:85, caffeine:70 }, rarity: "uncommon" },
  { id: "peppermint-vital", nameKo: "페퍼민트",       axis: "활력", profile: { afternoon:80, wakeup:70, fatigue:90, caffeine:65 }, rarity: "common" },
  { id: "rosemary-vital",   nameKo: "로즈마리",       axis: "활력", profile: { afternoon:75, wakeup:90, fatigue:60, caffeine:60 }, rarity: "common" },
  { id: "sweet-orange-vital",nameKo:"스위트오렌지",   axis: "활력", profile: { afternoon:60, wakeup:65, fatigue:50, caffeine:45 }, rarity: "common" },
  // 몰입
  { id: "rosemary",         nameKo: "로즈마리",       axis: "몰입", profile: { duration:95, distract:80, switch:75, screen:60 }, rarity: "common" },
  { id: "peppermint",       nameKo: "페퍼민트",       axis: "몰입", profile: { duration:85, distract:90, switch:80, screen:70 }, rarity: "common" },
  { id: "lemon",            nameKo: "레몬",           axis: "몰입", profile: { duration:70, distract:85, switch:90, screen:80 }, rarity: "common" },
  { id: "grapefruit-focus", nameKo: "자몽",           axis: "몰입", profile: { duration:65, distract:75, switch:70, screen:75 }, rarity: "uncommon" },
  // 청정
  { id: "eucalyptus",       nameKo: "유칼립투스",     axis: "청정", profile: { airway:95, sensitive:20, stuffy:60, hygiene:70 }, rarity: "common" },
  { id: "ravintsara",       nameKo: "라빈차라",       axis: "청정", profile: { airway:85, sensitive:90, stuffy:55, hygiene:75 }, rarity: "rare" },
  { id: "hinoki",           nameKo: "편백",           axis: "청정", profile: { airway:40, sensitive:80, stuffy:95, hygiene:55 }, rarity: "uncommon" },
  { id: "scots-pine",       nameKo: "스코치파인",     axis: "청정", profile: { airway:50, sensitive:70, stuffy:90, hygiene:50 }, rarity: "uncommon" },
  { id: "tea-tree",         nameKo: "티트리",         axis: "청정", profile: { airway:45, sensitive:35, stuffy:40, hygiene:95 }, rarity: "common" },
  { id: "myrtle",           nameKo: "머틀",           axis: "청정", profile: { airway:75, sensitive:85, stuffy:50, hygiene:60 }, rarity: "rare" },
];

function rarityRank(r) {
  return r === "rare" ? 3 : r === "uncommon" ? 2 : 1;
}

function computeFacetScores(rawScores) {
  const result = {};
  for (const [facet, raw] of Object.entries(rawScores)) {
    result[facet] = ((raw - 1) / 3) * 100;
  }
  return result;
}

function determineAxis(axisScores) {
  let bestAxis = null;
  let bestScore = Infinity;
  for (const [axis, score] of Object.entries(axisScores)) {
    if (score < bestScore) { bestScore = score; bestAxis = axis; }
  }
  return bestAxis;
}

function matchScents(facetScores, axis) {
  const facets = AXIS_FACETS[axis];
  const need = {};
  for (const f of facets) need[f] = 100 - (facetScores[f] ?? 0);

  const totalNeed = facets.reduce((s, f) => s + need[f], 0);
  const axisScents = scents.filter(s => s.axis === axis);

  if (totalNeed === 0) return axisScents.slice(0, 4);

  const primaryFacet = facets.reduce((best, f) => need[f] > need[best] ? f : best, facets[0]);

  return axisScents
    .map(scent => {
      let num = 0;
      for (const f of facets) num += need[f] * (scent.profile[f] ?? 0);
      return { scent, matchScore: num / totalNeed, primaryFacet };
    })
    .sort((a, b) => {
      const diff = b.matchScore - a.matchScore;
      if (Math.abs(diff) < 3) return rarityRank(b.scent.rarity) - rarityRank(a.scent.rarity);
      return diff;
    })
    .map(r => r.scent);
}

function simulate(overrides = {}) {
  const axisScores = { 숙면: 0, 이완: 0, 활력: 0, 몰입: 0, 청정: 0 };
  const facetRaw = {};

  for (const q of questions) {
    const raw = overrides[q.id] !== undefined ? overrides[q.id] : Math.ceil(Math.random() * 4);
    axisScores[q.axis] += raw;
    facetRaw[q.facet] = raw;
  }

  const axis = determineAxis(axisScores);
  const normalizedFacet = computeFacetScores(facetRaw);
  const ranked = matchScents(normalizedFacet, axis);
  return { axis, top1: ranked[0]?.id, top2: ranked[1]?.id, ranked };
}

// ── 5000회 랜덤 시뮬레이션 ──
const N = 5000;
const comboCounts = {};
const scentCounts = {};

for (let i = 0; i < N; i++) {
  const { axis, top1, top2, ranked } = simulate();
  const key = `${axis}|${top1}+${top2}`;
  comboCounts[key] = (comboCounts[key] || 0) + 1;
  // 향별 1위 카운트
  scentCounts[top1] = (scentCounts[top1] || 0) + 1;
}

const sortedCombos = Object.entries(comboCounts).sort((a, b) => b[1] - a[1]);
const sortedScents = Object.entries(scentCounts).sort((a, b) => b[1] - a[1]);

console.log(`\n=== 5000회 샘플링 결과 ===`);
console.log(`조합 종류 수: ${sortedCombos.length} (기대치: 40 이상)`);
console.log(`\n상위 5개 조합:`);
for (const [key, cnt] of sortedCombos.slice(0, 5)) {
  console.log(`  ${key}: ${cnt}회 (${(cnt/N*100).toFixed(1)}%)`);
}
console.log(`\n향별 1위 추천 횟수:`);
for (const [id, cnt] of sortedScents) {
  const pct = (cnt/N*100).toFixed(1);
  const warn = cnt/N > 0.25 ? " ⚠ 25% 초과" : "";
  console.log(`  ${id}: ${cnt}회 (${pct}%)${warn}`);
}

// ── 케이스 검증 ──
console.log(`\n=== 케이스 검증 ===`);

// 케이스 A: Q19=d(1), Q18=a(4), 나머지 청정 랜덤, 비청정 축 점수는 높게
// Q17=hygiene, Q18=sensitive, Q19=airway, Q20=stuffy
// 청정이 최저 축이 되도록 나머지 축은 모두 4점
const caseA = simulate({
  1: 4, 2: 4, 3: 4, 4: 4,  // 숙면 all high
  5: 4, 6: 4, 7: 4, 8: 4,  // 이완 all high
  9: 4, 10: 4, 11: 4, 12: 4, // 활력 all high
  13: 4, 14: 4, 15: 4, 16: 4, // 몰입 all high
  17: 2, 18: 4, 19: 1, 20: 2, // 청정: hygiene=2, sensitive=4(전혀아님), airway=1(매일), stuffy=2
});
console.log(`케이스 A (Q19=d/매일, Q18=a/전혀): axis=${caseA.axis}, 1위=${caseA.top1}`);
console.log(`  → 기대: 청정, 유칼립투스(eucalyptus). ${caseA.axis === "청정" && caseA.top1 === "eucalyptus" ? "✅ PASS" : "❌ FAIL"}`);

// 케이스 B: Q19=d(1), Q18=d(1), 나머지 청정 middle
const caseB = simulate({
  1: 4, 2: 4, 3: 4, 4: 4,
  5: 4, 6: 4, 7: 4, 8: 4,
  9: 4, 10: 4, 11: 4, 12: 4,
  13: 4, 14: 4, 15: 4, 16: 4,
  17: 2, 18: 1, 19: 1, 20: 2, // sensitive=1(매우그렇다), airway=1(매일)
});
console.log(`케이스 B (Q19=d/매일, Q18=d/매우): axis=${caseB.axis}, 1위=${caseB.top1}`);
console.log(`  → 기대: 청정, 라빈차라(ravintsara). ${caseB.axis === "청정" && caseB.top1 === "ravintsara" ? "✅ PASS" : "❌ FAIL"}`);

// 케이스 C: Q7=d(1), 나머지 이완 all a(4)
const caseC = simulate({
  1: 4, 2: 4, 3: 4, 4: 4,
  5: 4, 6: 4, 7: 1, 8: 4,  // autonomic=1, others=4
  9: 4, 10: 4, 11: 4, 12: 4,
  13: 4, 14: 4, 15: 4, 16: 4,
  17: 4, 18: 4, 19: 4, 20: 4,
});
console.log(`케이스 C (Q7=d/매우자주, 나머지이완=a): axis=${caseC.axis}, 1위=${caseC.top1}`);
console.log(`  → 기대: 이완, 파촐리(patchouli). ${caseC.axis === "이완" && caseC.top1 === "patchouli" ? "✅ PASS" : "❌ FAIL"}`);

// A/B 서로 다른 향인지
console.log(`\nA ≠ B 검증: ${caseA.top1 !== caseB.top1 ? "✅ PASS (서로 다른 향)" : "❌ FAIL (같은 향)"}`);

console.log();
