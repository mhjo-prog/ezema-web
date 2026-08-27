import { describe, it, expect } from "vitest";
import { recommend, computeZWithin, computeFlags } from "./recommend";
import type { RecommendInput } from "./recommend";

// ------------------------------------------------------------------
// 헬퍼: 축별 원점수를 고정한 itemScores 생성
// 각 축 3문항에 동일 값을 부여 (Q1=숙면, Q6=숙면, Q11=숙면 등)
// ------------------------------------------------------------------
function makeItemScores(axisScores: Record<string, number>): Record<string, number> {
  const mapping: Record<string, string[]> = {
    숙면: ["Q1", "Q6", "Q11"],
    이완: ["Q2", "Q8", "Q14"],
    활력: ["Q5", "Q9", "Q13"],
    몰입: ["Q4", "Q10", "Q15"],
    청정: ["Q3", "Q7", "Q12"],
  };
  const result: Record<string, number> = {};
  for (const [axis, score] of Object.entries(axisScores)) {
    const questions = mapping[axis] ?? [];
    // 3문항 합산이 score가 되도록 각 문항에 균등 분배 (분수는 올림)
    const perQ = Math.round(score / questions.length);
    for (const q of questions) {
      result[q] = Math.max(1, Math.min(4, perQ));
    }
  }
  return result;
}

// 기본 입력 (Part B 미제공, 1회차)
const BASE_INPUT: RecommendInput = {
  itemScores: makeItemScores({ 숙면: 9, 이완: 6, 활력: 6, 몰입: 6, 청정: 6 }),
  surveyCount: 0,
};

// ------------------------------------------------------------------
// 케이스 1: 단일 최고점 (정상 경로)
// 숙면 12, 나머지 3 → primaryAxis = "숙면"
// ------------------------------------------------------------------
describe("케이스 1 — 단일 최고점", () => {
  it("최고점 축이 추천 축이 된다", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 12, 이완: 3, 활력: 3, 몰입: 3, 청정: 3 }),
      surveyCount: 0,
    };
    const output = recommend(input);
    expect(output.primaryAxis).toBe("숙면");
    expect(output.tieBreakReason).toBeNull();
    expect(output.scents.length).toBeGreaterThan(0);
    expect(output.scents.every((r) => r.scent.axis === "숙면")).toBe(true);
  });
});

// ------------------------------------------------------------------
// 케이스 2: 2개 축 동점 → 공간별 tie-break 각각
// ------------------------------------------------------------------
describe("케이스 2 — 2개 축 동점, 공간별 tie-break", () => {
  const tiedInput: RecommendInput = {
    itemScores: makeItemScores({ 숙면: 10, 이완: 10, 활력: 3, 몰입: 3, 청정: 3 }),
    surveyCount: 0,
  };

  it("침실 → 숙면 우선", () => {
    const output = recommend({ ...tiedInput, space: "침실" });
    expect(output.primaryAxis).toBe("숙면");
    expect(output.tieBreakReason).toContain("침실");
  });

  it("거실·주방 → 이완 우선", () => {
    const output = recommend({ ...tiedInput, space: "거실·주방" });
    expect(output.primaryAxis).toBe("이완");
    expect(output.tieBreakReason).toContain("거실·주방");
  });

  it("사무실·작업공간(몰입·활력 동점) → 몰입 우선", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 3, 이완: 3, 활력: 10, 몰입: 10, 청정: 3 }),
      surveyCount: 0,
      space: "사무실·작업공간",
    };
    const output = recommend(input);
    expect(output.primaryAxis).toBe("몰입");
    expect(output.tieBreakReason).toContain("사무실·작업공간");
  });

  it("차량(활력·몰입 동점) → 활력 우선", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 3, 이완: 3, 활력: 10, 몰입: 10, 청정: 3 }),
      surveyCount: 0,
      space: "차량",
    };
    const output = recommend(input);
    expect(output.primaryAxis).toBe("활력");
    expect(output.tieBreakReason).toContain("차량");
  });
});

// ------------------------------------------------------------------
// 케이스 3: 3개 이상 축 동점
// 숙면=이완=활력=10, 나머지 3 → space 없으면 기본 순서로 숙면
// ------------------------------------------------------------------
describe("케이스 3 — 3개 이상 축 동점", () => {
  it("공간 없음 → 기본 순서(숙면 > 이완 > 활력)로 숙면", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 10, 이완: 10, 활력: 10, 몰입: 3, 청정: 3 }),
      surveyCount: 0,
    };
    const output = recommend(input);
    expect(output.primaryAxis).toBe("숙면");
    expect(output.tieBreakReason).toContain("기본 순서");
  });

  it("tieBreakReason이 동점 축들을 언급한다", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 10, 이완: 10, 활력: 10, 몰입: 3, 청정: 3 }),
      surveyCount: 0,
    };
    const output = recommend(input);
    expect(output.tieBreakReason).not.toBeNull();
  });
});

// ------------------------------------------------------------------
// 케이스 4: 전 축 양호 → 시그니처 분기
// 코호트 없을 때 원점수 기준: 모든 축 ≤ 5
// ------------------------------------------------------------------
describe("케이스 4 — 전 축 양호", () => {
  it("모든 축 ≤ 5점이면 primaryAxis = 'signature'", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 3, 이완: 3, 활력: 3, 몰입: 3, 청정: 3 }),
      surveyCount: 0,
    };
    const output = recommend(input);
    expect(output.primaryAxis).toBe("signature");
    expect(output.scents.length).toBeGreaterThan(0);
  });

  it("선호 계열이 있으면 해당 계열 향을 우선 반환", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 3, 이완: 3, 활력: 3, 몰입: 3, 청정: 3 }),
      surveyCount: 0,
      preferences: ["시트러스"],
    };
    const output = recommend(input);
    expect(output.primaryAxis).toBe("signature");
    // 시그니처 분기에서 시트러스 향이 포함되어야 함
    const scentCategories = output.scents.map((r) => r.scent.nameKo);
    expect(scentCategories.length).toBeGreaterThan(0);
  });
});

// ------------------------------------------------------------------
// 케이스 5: 비선호 필터로 1순위 SKU 제외
// 숙면 축 1위지만 허브·그린 비선호 → 라벤더 제외
// ------------------------------------------------------------------
describe("케이스 5 — 비선호 필터", () => {
  it("비선호 계열 향이 filteredOut에 포함된다", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 12, 이완: 3, 활력: 3, 몰입: 3, 청정: 3 }),
      surveyCount: 0,
      avoided: ["허브·그린"],
    };
    const output = recommend(input);
    expect(output.primaryAxis).toBe("숙면");
    // 라벤더(허브·그린)가 filteredOut에 있어야 함
    const filteredIds = output.filteredOut.map((f) => f.scentId);
    expect(filteredIds).toContain("lavender-sleep");
    // 남은 향은 허브·그린이 아닌 것
    const appliedTypes = output.appliedFilters.map((f) => f.type);
    expect(appliedTypes).toContain("avoid");
  });
});

// ------------------------------------------------------------------
// 케이스 6: 필터로 모든 SKU 제외 → 폴백
// 이완 축에서 모든 계열을 비선호로 지정
// ------------------------------------------------------------------
describe("케이스 6 — 필터 후 모든 SKU 제외 → 폴백", () => {
  it("폴백 향이 반환된다", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 3, 이완: 12, 활력: 3, 몰입: 3, 청정: 3 }),
      surveyCount: 0,
      avoided: ["시트러스", "플로럴", "우디·머스크", "허브·그린", "스파이시·오리엔탈"],
    };
    const output = recommend(input);
    // 폴백이 동작해서 scents가 비어있지 않아야 함
    expect(output.scents.length).toBeGreaterThan(0);
    // 안전 타입 필터가 appliedFilters에 포함
    const appliedTypes = output.appliedFilters.map((f) => f.type);
    expect(appliedTypes).toContain("safety");
  });
});

// ------------------------------------------------------------------
// 케이스 7: 안전 플래그(임신) 조합
// 임신·수유 중 → 주의 향 제외
// ------------------------------------------------------------------
describe("케이스 7 — 안전 플래그(임신·수유)", () => {
  it("임신 주의 향이 filteredOut에 포함된다", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 12, 이완: 3, 활력: 3, 몰입: 3, 청정: 3 }),
      surveyCount: 0,
      safetyFlags: ["임신·수유"],
    };
    const output = recommend(input);
    const filteredIds = output.filteredOut.map((f) => f.scentId);
    // 베르가못(숙면 축)은 임신 주의 향
    expect(filteredIds).toContain("bergamot-sleep");
    const appliedTypes = output.appliedFilters.map((f) => f.type);
    expect(appliedTypes).toContain("pregnancy");
  });

  it("알레르기 플래그는 필터 설명을 추가한다", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 12, 이완: 3, 활력: 3, 몰입: 3, 청정: 3 }),
      surveyCount: 0,
      safetyFlags: ["알레르기"],
    };
    const output = recommend(input);
    const appliedTypes = output.appliedFilters.map((f) => f.type);
    expect(appliedTypes).toContain("allergy");
  });
});

// ------------------------------------------------------------------
// 케이스 8: 코호트 통계 부재 시 원점수 폴백
// cohortStats 없음 → axisZBetween = null, 원점수 기준 추천
// ------------------------------------------------------------------
describe("케이스 8 — 코호트 통계 부재", () => {
  it("cohortStats 없으면 axisZBetween이 null이다", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 12, 이완: 3, 활력: 3, 몰입: 3, 청정: 3 }),
      surveyCount: 0,
    };
    const output = recommend(input);
    expect(output.axisZBetween).toBeNull();
  });

  it("코호트 n < 200이면 axisZBetween이 null이다", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 12, 이완: 3, 활력: 3, 몰입: 3, 청정: 3 }),
      surveyCount: 0,
      cohortStats: {
        숙면: { mean: 7, sd: 2, n: 150 }, // n < 200
        이완: { mean: 7, sd: 2, n: 150 },
        활력: { mean: 7, sd: 2, n: 150 },
        몰입: { mean: 7, sd: 2, n: 150 },
        청정: { mean: 7, sd: 2, n: 150 },
      },
    };
    const output = recommend(input);
    expect(output.axisZBetween).toBeNull();
    // 원점수 기준으로 숙면이 추천됨
    expect(output.primaryAxis).toBe("숙면");
  });

  it("코호트 n >= 200이면 z_between이 계산된다", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 12, 이완: 3, 활력: 3, 몰입: 3, 청정: 3 }),
      surveyCount: 0,
      cohortStats: {
        숙면: { mean: 7, sd: 2, n: 200 },
        이완: { mean: 7, sd: 2, n: 200 },
        활력: { mean: 7, sd: 2, n: 200 },
        몰입: { mean: 7, sd: 2, n: 200 },
        청정: { mean: 7, sd: 2, n: 200 },
      },
    };
    const output = recommend(input);
    expect(output.axisZBetween).not.toBeNull();
    expect(output.primaryAxis).toBe("숙면");
  });
});

// ------------------------------------------------------------------
// 케이스 9: 관측 2개일 때 z_within 미계산
// ------------------------------------------------------------------
describe("케이스 9 — z_within 미계산 조건", () => {
  it("surveyCount < 3이면 z_within이 null이다", () => {
    const output = computeZWithin(
      { 숙면: 10, 이완: 6, 활력: 6, 몰입: 6, 청정: 6 },
      { 숙면: 7, 이완: 7, 활력: 7, 몰입: 7, 청정: 7 },
      { 숙면: 1.5, 이완: 1.5, 활력: 1.5, 몰입: 1.5, 청정: 1.5 },
      2 // surveyCount = 2 → 미계산
    );
    expect(output).toBeNull();
  });

  it("surveyCount >= 3이면 z_within이 계산된다", () => {
    const output = computeZWithin(
      { 숙면: 10, 이완: 6, 활력: 6, 몰입: 6, 청정: 6 },
      { 숙면: 7, 이완: 7, 활력: 7, 몰입: 7, 청정: 7 },
      { 숙면: 1.5, 이완: 1.5, 활력: 1.5, 몰입: 1.5, 청정: 1.5 },
      3
    );
    expect(output).not.toBeNull();
    // 숙면: (10-7)/1.5 = 2.0
    expect(output!["숙면"]).toBeCloseTo(2.0, 5);
  });

  it("recommend에서 surveyCount=2이면 output.axisZWithin이 null", () => {
    const input: RecommendInput = {
      itemScores: makeItemScores({ 숙면: 10, 이완: 6, 활력: 6, 몰입: 6, 청정: 6 }),
      surveyCount: 2,
      baseline: { 숙면: 7, 이완: 7, 활력: 7, 몰입: 7, 청정: 7 },
      sdWithin: { 숙면: 1.5, 이완: 1.5, 활력: 1.5, 몰입: 1.5, 청정: 1.5 },
    };
    const output = recommend(input);
    expect(output.axisZWithin).toBeNull();
  });
});

// ------------------------------------------------------------------
// 추가: straight-lining 탐지
// 역방향 문항(Q3·Q8·Q9·Q11·Q15)은 itemScores에 이미 반전 배점으로 저장됨.
//   전 문항 'a' → 정방향=1, 역방향=4, 차이=3 → straightlining=true
//   전 문항 'd' → 정방향=4, 역방향=1, 차이=3 → straightlining=true
//   성실한 응답  → 정방향≈역방향, 차이≈0     → straightlining=false
// ------------------------------------------------------------------
const REVERSE_IDS = new Set(["Q3", "Q8", "Q9", "Q11", "Q15"]);

function makeAllA(): Record<string, number> {
  const scores: Record<string, number> = {};
  for (let i = 1; i <= 15; i++) {
    // 정방향: a=1, 역방향: a=4 (보기가 뒤집혀 배점됨)
    scores[`Q${i}`] = REVERSE_IDS.has(`Q${i}`) ? 4 : 1;
  }
  return scores;
}

function makeAllD(): Record<string, number> {
  const scores: Record<string, number> = {};
  for (let i = 1; i <= 15; i++) {
    // 정방향: d=4, 역방향: d=1 (보기가 뒤집혀 배점됨)
    scores[`Q${i}`] = REVERSE_IDS.has(`Q${i}`) ? 1 : 4;
  }
  return scores;
}

describe("응답 품질 플래그 — straight-lining", () => {
  it("정상 응답(일관된 중간값) → straightlining=false", () => {
    // 정방향, 역방향 모두 동일 중간값 → 차이 0 < 1.5 → 플래그 없음
    const normal: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) normal[`Q${i}`] = 3;
    const flags = computeFlags(normal, null);
    expect(flags.straightlining).toBe(false);
  });

  it("전 문항 'a' 선택 → straightlining=true", () => {
    // 정방향=1, 역방향=4, 차이=3 > 1.5 → 플래그
    const flags = computeFlags(makeAllA(), null);
    expect(flags.straightlining).toBe(true);
  });

  it("전 문항 'd' 선택 → straightlining=true", () => {
    // 정방향=4, 역방향=1, 차이=3 > 1.5 → 플래그
    const flags = computeFlags(makeAllD(), null);
    expect(flags.straightlining).toBe(true);
  });

  it("tooFast: 15초 미만이면 true", () => {
    const flags = computeFlags({}, 10_000);
    expect(flags.tooFast).toBe(true);
  });

  it("tooFast: 30초 이상이면 false", () => {
    const flags = computeFlags({}, 30_000);
    expect(flags.tooFast).toBe(false);
  });
});
