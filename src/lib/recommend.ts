// =============================================================
// 향 추천 엔진 v2 — 순수 함수
// DB·화면 의존성 없음. 입력 → 출력만.
// 스펙 §3 전체 구현.
// =============================================================

import type { AxisV2, ScentCategoryV2, SpaceV2, SafetyFlagV2 } from "../data/surveyV2";
import { AXIS_QUESTIONS, REVERSE_QUESTION_IDS } from "../data/surveyV2";
import { scents } from "../data/scents";
import type { Scent } from "../data/scents";

// ------------------------------------------------------------------
// 향 카테고리 매핑 (scents.ts에 없으므로 여기서 정의)
// ------------------------------------------------------------------
const SCENT_CATEGORY_MAP: Record<string, ScentCategoryV2> = {
  "lavender-sleep":    "허브·그린",
  "cedarwood":         "우디·머스크",
  "bergamot-sleep":    "시트러스",
  "roman-chamomile":   "플로럴",
  "sweet-orange-sleep":"시트러스",
  "patchouli":         "우디·머스크",
  "neroli":            "플로럴",
  "bergamot":          "시트러스",
  "frankincense":      "우디·머스크",
  "lavender-relax":    "허브·그린",
  "sweet-orange":      "시트러스",
  "black-pepper":      "스파이시·오리엔탈",
  "grapefruit":        "시트러스",
  "peppermint-vital":  "허브·그린",
  "rosemary-vital":    "허브·그린",
  "sweet-orange-vital":"시트러스",
  "rosemary":          "허브·그린",
  "peppermint":        "허브·그린",
  "lemon":             "시트러스",
  "grapefruit-focus":  "시트러스",
  "eucalyptus":        "허브·그린",
  "ravintsara":        "허브·그린",
  "hinoki":            "우디·머스크",
  "scots-pine":        "우디·머스크",
  "tea-tree":          "허브·그린",
  "myrtle":            "허브·그린",
};

// 임신·수유 중 주의 향 (광독성 포함)
const PREGNANCY_AVOID_IDS = new Set([
  "bergamot-sleep",
  "bergamot",
  "patchouli",
  "black-pepper",
  "frankincense",
  "rosemary",
  "rosemary-vital",
  "peppermint",
  "peppermint-vital",
]);

// 전 축 양호 판단 임계값 (원점수, 3문항 합산 기준)
const ALL_GOOD_RAW_THRESHOLD = 5;

// 응답 시간 최소치 (ms, 이하면 tooFast 플래그)
const TOO_FAST_MS = 15_000;

// 동점 처리: 공간별 우선 축
const SPACE_TIEBREAK: Record<SpaceV2, AxisV2[]> = {
  "침실":          ["숙면", "이완"],
  "거실·주방":     ["이완", "청정"],
  "사무실·작업공간": ["몰입", "활력"],
  "차량":          ["활력", "몰입"],
  "기타":          [],
};

// 동점 처리: 기본 순서 (SPACE_TIEBREAK로도 해결 안 될 때)
const DEFAULT_AXIS_ORDER: AxisV2[] = ["숙면", "이완", "활력", "몰입", "청정"];

// 안전 라인 폴백 SKU (필터로 모든 향이 제외됐을 때 사용)
const FALLBACK_SAFE_SCENT_ID = "sweet-orange"; // 시트러스, 금기 없음

// ------------------------------------------------------------------
// 타입 정의
// ------------------------------------------------------------------

export interface CohortStat {
  mean: number;
  sd: number;
  n: number;
}

export interface RecommendInput {
  /** 문항별 응답 점수 { Q1: 3, Q2: 1, ... } */
  itemScores: Record<string, number>;
  /** 이 사용자의 누적 응답 횟수 (현재 응답 포함 전) */
  surveyCount: number;
  /** 개인 기준선 (2회차 이상, user_baselines에서 로드) */
  baseline?: Partial<Record<AxisV2, number>>;
  /** 개인 표준편차 (관측 3개 이상일 때만 전달) */
  sdWithin?: Partial<Record<AxisV2, number>>;
  /** 코호트 통계 (200건 이상일 때 전달) */
  cohortStats?: Partial<Record<AxisV2, CohortStat>>;
  /** Q16: 선호 향 계열 */
  preferences?: ScentCategoryV2[];
  /** Q17: 비선호 향 계열 */
  avoided?: ScentCategoryV2[];
  /** Q18: 사용 공간 */
  space?: SpaceV2;
  /** Q19: 안전 플래그 */
  safetyFlags?: SafetyFlagV2[];
  /** 응답 시작 시각 (ms, 품질 플래그용) */
  startedAt?: number;
  /** 응답 완료 시각 (ms, 품질 플래그용) */
  submittedAt?: number;
}

export interface ScentResult {
  scent: Scent;
  reason: string;
}

export interface FilteredOut {
  scentId: string;
  reason: string;
}

export interface AppliedFilter {
  type: "avoid" | "prefer_sort" | "safety" | "pregnancy" | "allergy" | "children_pet";
  description: string;
}

export interface RecommendOutput {
  /** 추천 축. "signature" = 전 축 양호 분기 */
  primaryAxis: AxisV2 | "signature";
  /** 동점 처리 이유 (화면 표시용) */
  tieBreakReason: string | null;
  /** 추천 향 목록 (최대 4개) */
  scents: ScentResult[];
  /** 필터로 제외된 향 */
  filteredOut: FilteredOut[];
  /** 적용된 필터 목록 */
  appliedFilters: AppliedFilter[];
  /** 축별 원점수 (DB 저장용) */
  axisRaw: Record<AxisV2, number>;
  /** 축별 z_between (코호트 200건 미만이면 null) */
  axisZBetween: Partial<Record<AxisV2, number>> | null;
  /** 축별 z_within (관측 3개 미만이면 null) */
  axisZWithin: Partial<Record<AxisV2, number>> | null;
  /** 응답 품질 플래그 */
  flags: { straightlining: boolean; tooFast: boolean };
}

// ------------------------------------------------------------------
// §3-1. 축 점수 계산
// ------------------------------------------------------------------

export function computeAxisScores(
  itemScores: Record<string, number>
): Record<AxisV2, number> {
  const result = {} as Record<AxisV2, number>;
  for (const [axis, qIds] of Object.entries(AXIS_QUESTIONS) as [AxisV2, string[]][]) {
    result[axis] = qIds.reduce((sum, qId) => sum + (itemScores[qId] ?? 0), 0);
  }
  return result;
}

// ------------------------------------------------------------------
// §3-2. 축 간 표준화 (z_between)
// ------------------------------------------------------------------

function computeZBetween(
  axisRaw: Record<AxisV2, number>,
  cohortStats: Partial<Record<AxisV2, CohortStat>>
): Partial<Record<AxisV2, number>> {
  const z: Partial<Record<AxisV2, number>> = {};
  for (const axis of DEFAULT_AXIS_ORDER) {
    const stat = cohortStats[axis];
    if (!stat || stat.sd === 0) continue;
    z[axis] = (axisRaw[axis] - stat.mean) / stat.sd;
  }
  return z;
}

// ------------------------------------------------------------------
// §3-3. 개인 기준선 (z_within)
// ------------------------------------------------------------------

export function computeZWithin(
  axisRaw: Record<AxisV2, number>,
  baseline: Partial<Record<AxisV2, number>>,
  sdWithin: Partial<Record<AxisV2, number>>,
  surveyCount: number
): Partial<Record<AxisV2, number>> | null {
  // 관측 3개 미만이면 계산하지 않는다 (surveyCount는 이번 응답 포함 전)
  if (surveyCount < 3) return null;

  const z: Partial<Record<AxisV2, number>> = {};
  for (const axis of DEFAULT_AXIS_ORDER) {
    const base = baseline[axis];
    const sd = sdWithin[axis];
    if (base === undefined || sd === undefined || sd === 0) continue;
    z[axis] = (axisRaw[axis] - base) / sd;
  }
  return Object.keys(z).length > 0 ? z : null;
}

// ------------------------------------------------------------------
// §3-4. 동점 처리
// ------------------------------------------------------------------

function resolveTie(
  tiedAxes: AxisV2[],
  space: SpaceV2 | undefined
): { winner: AxisV2; reason: string | null } {
  if (tiedAxes.length === 1) return { winner: tiedAxes[0], reason: null };

  // 공간별 우선 순위
  if (space && space !== "기타") {
    const priority = SPACE_TIEBREAK[space];
    for (const axis of priority) {
      if (tiedAxes.includes(axis)) {
        const spaceLabel = space;
        return {
          winner: axis,
          reason: `${tiedAxes.join("과 ")}이 같은 점수였고, ${spaceLabel} 사용을 선택하셔서 ${axis}을 먼저 봤어요`,
        };
      }
    }
  }

  // 기본 순서
  for (const axis of DEFAULT_AXIS_ORDER) {
    if (tiedAxes.includes(axis)) {
      return {
        winner: axis,
        reason:
          tiedAxes.length > 1
            ? `${tiedAxes.join("과 ")}이 같은 점수로, 기본 순서에 따라 ${axis}을 먼저 봤어요`
            : null,
      };
    }
  }

  return { winner: tiedAxes[0], reason: null };
}

// ------------------------------------------------------------------
// §3-5. 전 축 양호 판단
// ------------------------------------------------------------------

function isAllGood(
  axisRaw: Record<AxisV2, number>,
  zBetween: Partial<Record<AxisV2, number>> | null,
  cohortAvailable: boolean
): boolean {
  if (cohortAvailable && zBetween) {
    // 코호트 기준: 모든 z < 0
    return DEFAULT_AXIS_ORDER.every((axis) => (zBetween[axis] ?? 0) < 0);
  }
  // 원점수 기준: 모든 축 ≤ 5 (3~12점 범위에서 낮은 쪽)
  return DEFAULT_AXIS_ORDER.every((axis) => axisRaw[axis] <= ALL_GOOD_RAW_THRESHOLD);
}

// ------------------------------------------------------------------
// §3-6. 필터
// ------------------------------------------------------------------

function applyFilters(
  axisScents: Scent[],
  avoided: ScentCategoryV2[] | undefined,
  preferences: ScentCategoryV2[] | undefined,
  safetyFlags: SafetyFlagV2[] | undefined
): {
  remaining: Scent[];
  filteredOut: FilteredOut[];
  appliedFilters: AppliedFilter[];
} {
  const filteredOut: FilteredOut[] = [];
  const appliedFilters: AppliedFilter[] = [];
  let remaining = [...axisScents];

  // 1. Q17 비선호 계열 제외
  if (avoided && avoided.length > 0) {
    const before = remaining.length;
    remaining = remaining.filter((s) => {
      const cat = SCENT_CATEGORY_MAP[s.id];
      if (cat && avoided.includes(cat)) {
        filteredOut.push({ scentId: s.id, reason: `${cat} 계열 비선호` });
        return false;
      }
      return true;
    });
    if (remaining.length < before) {
      appliedFilters.push({
        type: "avoid",
        description: `${avoided.join(", ")} 계열 비선호를 반영했어요`,
      });
    }
  }

  // 2. Q19 안전 플래그
  if (safetyFlags && safetyFlags.length > 0) {
    const hasPregnancy = safetyFlags.includes("임신·수유");
    const hasAllergy = safetyFlags.includes("알레르기");
    const hasChildrenOrPet =
      safetyFlags.includes("어린이") || safetyFlags.includes("반려동물");

    if (hasPregnancy) {
      const before = remaining.length;
      remaining = remaining.filter((s) => {
        if (PREGNANCY_AVOID_IDS.has(s.id)) {
          filteredOut.push({ scentId: s.id, reason: "임신·수유 중 주의 향" });
          return false;
        }
        return true;
      });
      if (remaining.length < before) {
        appliedFilters.push({
          type: "pregnancy",
          description: "임신·수유 중 주의 향을 제외했어요. 사용 전 전문가 상담을 권장해요",
        });
      }
    }

    if (hasAllergy) {
      appliedFilters.push({
        type: "allergy",
        description: "알레르기 경험이 있으시면 사용 전 팔 안쪽에 패치 테스트를 해보세요",
      });
    }

    if (hasChildrenOrPet) {
      appliedFilters.push({
        type: "children_pet",
        description: "어린이·반려동물이 있는 공간에서는 직접 흡입보다 간접 확산 방식을 권장해요",
      });
    }
  }

  // 필터 후 모든 SKU가 제외된 경우 폴백
  if (remaining.length === 0) {
    const fallback = scents.find((s) => s.id === FALLBACK_SAFE_SCENT_ID);
    if (fallback) {
      remaining = [fallback];
      appliedFilters.push({
        type: "safety",
        description: "안전을 위해 조건에 맞는 기본 향을 대신 추천해요",
      });
    }
  }

  // 3. Q16 선호 계열 우선 정렬 (제거가 아닌 정렬)
  if (preferences && preferences.length > 0) {
    const preferred = remaining.filter((s) => {
      const cat = SCENT_CATEGORY_MAP[s.id];
      return cat && preferences.includes(cat);
    });
    const others = remaining.filter((s) => {
      const cat = SCENT_CATEGORY_MAP[s.id];
      return !cat || !preferences.includes(cat);
    });
    remaining = [...preferred, ...others];
    if (preferred.length > 0) {
      appliedFilters.push({
        type: "prefer_sort",
        description: `${preferences.join(", ")} 계열 선호를 반영했어요`,
      });
    }
  }

  return { remaining, filteredOut, appliedFilters };
}

// ------------------------------------------------------------------
// §3-7. 응답 품질 플래그
// ------------------------------------------------------------------

export function computeFlags(
  itemScores: Record<string, number>,
  durationMs: number | null
): { straightlining: boolean; tooFast: boolean } {
  // straight-lining: 정방향 문항과 역방향 문항의 합이 체계적으로 모순
  // 역방향 문항(Q3, Q8, Q9, Q11, Q15)의 실제 배점은 이미 뒤집혀 있으므로
  // "모든 답이 동일"하면 역방향과 정방향이 서로 상쇄됨 → 총점이 극단에 몰림
  const tooFast = durationMs !== null && durationMs < TOO_FAST_MS;

  const allScores = Object.values(itemScores);
  const partALength = 15;
  if (allScores.length < partALength) {
    return { straightlining: false, tooFast };
  }

  // 역방향과 정방향 응답의 평균 차이로 straight-lining 탐지
  const reverseIds = Array.from(REVERSE_QUESTION_IDS);
  const forwardIds = Object.keys(itemScores).filter(
    (id) => id.startsWith("Q") && !REVERSE_QUESTION_IDS.has(id)
  );

  const reverseAvg =
    reverseIds.reduce((s, id) => s + (itemScores[id] ?? 0), 0) / (reverseIds.length || 1);
  const forwardAvg =
    forwardIds.reduce((s, id) => s + (itemScores[id] ?? 0), 0) / (forwardIds.length || 1);

  // 역방향 평균과 정방향 평균의 차이가 크면 straight-lining 의심
  // 성실한 응답자: 정방향 ≈ 역방향 → 차이 작음(0에 수렴)
  // 전부 'a': 정방향=1, 역방향=4 → 차이 3 (크다)
  // 전부 'd': 정방향=4, 역방향=1 → 차이 3 (크다)
  const STRAIGHTLINING_GAP = 1.5; // 파일럿 데이터로 재조정할 잠정치
  const straightlining = Math.abs(reverseAvg - forwardAvg) > STRAIGHTLINING_GAP;

  return { straightlining, tooFast };
}

// ------------------------------------------------------------------
// 메인 추천 함수
// ------------------------------------------------------------------

export function recommend(input: RecommendInput): RecommendOutput {
  const {
    itemScores,
    surveyCount,
    baseline,
    sdWithin,
    cohortStats,
    preferences,
    avoided,
    space,
    safetyFlags,
    startedAt,
    submittedAt,
  } = input;

  // 1. 축 원점수 계산
  const axisRaw = computeAxisScores(itemScores);

  // 2. z_between 계산 (코호트 200건 이상일 때만 신뢰)
  const cohortAvailable =
    !!cohortStats &&
    DEFAULT_AXIS_ORDER.every((axis) => (cohortStats[axis]?.n ?? 0) >= 200);

  const axisZBetween: Partial<Record<AxisV2, number>> | null = cohortAvailable && cohortStats
    ? computeZBetween(axisRaw, cohortStats)
    : null;

  // 3. z_within 계산 (관측 3개 이상, 2회차 이상)
  const axisZWithin =
    surveyCount >= 2 && baseline && sdWithin && surveyCount >= 3
      ? computeZWithin(axisRaw, baseline, sdWithin, surveyCount)
      : null;

  // 4. 응답 품질 플래그
  const durationMs =
    startedAt !== undefined && submittedAt !== undefined
      ? submittedAt - startedAt
      : null;
  const flags = computeFlags(itemScores, durationMs);

  // 5. 추천 축 결정 — 2회차 이상이면 z_within 우선, 아니면 z_between 또는 원점수
  let scoreMap: Record<AxisV2, number>;

  if (surveyCount >= 2 && axisZWithin && Object.keys(axisZWithin).length > 0) {
    // z_within 사용 (개인 기준선 대비)
    scoreMap = axisZWithin as Record<AxisV2, number>;
  } else if (axisZBetween && Object.keys(axisZBetween).length > 0) {
    // z_between 사용 (코호트 대비)
    scoreMap = axisZBetween as Record<AxisV2, number>;
  } else {
    // 원점수 폴백
    scoreMap = axisRaw;
  }

  // 6. 전 축 양호 판단
  if (isAllGood(axisRaw, axisZBetween, cohortAvailable)) {
    // 시그니처 분기: Q16 선호 계열 기반 추천
    const signatureScents = scents.filter((s) => {
      if (!preferences || preferences.length === 0) return true;
      const cat = SCENT_CATEGORY_MAP[s.id];
      return cat && preferences.includes(cat);
    });
    const displayScents = (signatureScents.length > 0 ? signatureScents : scents)
      .slice(0, 4)
      .map((s) => ({ scent: s, reason: "지금 상태가 전반적으로 양호해요. 취향에 맞는 시그니처 향을 즐겨보세요" }));

    return {
      primaryAxis: "signature",
      tieBreakReason: null,
      scents: displayScents,
      filteredOut: [],
      appliedFilters: [],
      axisRaw,
      axisZBetween,
      axisZWithin,
      flags,
    };
  }

  // 7. 최고점 축 결정 (동점 처리 포함)
  const maxScore = Math.max(...DEFAULT_AXIS_ORDER.map((a) => scoreMap[a] ?? -Infinity));
  const tiedAxes = DEFAULT_AXIS_ORDER.filter((a) => scoreMap[a] === maxScore);
  const { winner: primaryAxis, reason: tieBreakReason } = resolveTie(tiedAxes, space);

  // 8. 해당 축의 향 필터링
  const axisScents = scents.filter((s) => s.axis === primaryAxis);
  const { remaining, filteredOut, appliedFilters } = applyFilters(
    axisScents,
    avoided,
    preferences,
    safetyFlags
  );

  // 9. 최대 4개 반환 (팩셋 매칭은 기존 matchScentPerFacet가 담당, 여기서는 순서 제공)
  const displayScents: ScentResult[] = remaining.slice(0, 4).map((s, i) => ({
    scent: s,
    reason:
      i === 0
        ? `${primaryAxis} 케어에 가장 먼저 추천해요`
        : `${primaryAxis} 케어에 함께 추천해요`,
  }));

  return {
    primaryAxis,
    tieBreakReason,
    scents: displayScents,
    filteredOut,
    appliedFilters,
    axisRaw,
    axisZBetween,
    axisZWithin,
    flags,
  };
}
