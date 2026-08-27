// =============================================================
// 향 추천 설문 v2 — 문항 정의
// 배점: a=1 ... d=4, 높을수록 케어 필요. 최고점 축 = 추천 향.
// reverse=true 문항은 보기 순서가 뒤집혀 있음 (straight-lining 탐지용).
// =============================================================

export type AxisV2 = "숙면" | "이완" | "활력" | "몰입" | "청정";

export type ScentCategoryV2 =
  | "시트러스"
  | "플로럴"
  | "우디·머스크"
  | "허브·그린"
  | "스파이시·오리엔탈";

export type SpaceV2 = "침실" | "거실·주방" | "사무실·작업공간" | "차량" | "기타";

export type SafetyFlagV2 =
  | "알레르기"
  | "임신·수유"
  | "어린이"
  | "반려동물";

export interface OptionV2 {
  label: string;
  score: number; // 1~4
}

export interface QuestionV2 {
  id: string;        // "Q1" ~ "Q15"
  axis: AxisV2;
  reverse: boolean;  // true = straight-lining 탐지용 역방향 문항
  text: string;
  options: OptionV2[];
}

// ------------------------------------------------------------------
// Part A — 상태 진단 (15문항, 5축 × 3문항)
// 문항 순서: 축이 연속 배치되지 않도록 Q1~Q15 그대로 유지
// ------------------------------------------------------------------

export const PART_A_QUESTIONS: QuestionV2[] = [
  {
    id: "Q1", axis: "숙면", reverse: false,
    text: "최근 일주일, 잠자리에 누운 뒤 잠들기까지\n보통 얼마나 걸렸나요?",
    options: [
      { label: "10분 이내",   score: 1 },
      { label: "10~20분",     score: 2 },
      { label: "20~40분",     score: 3 },
      { label: "40분 이상",   score: 4 },
    ],
  },
  {
    id: "Q2", axis: "이완", reverse: false,
    text: "최근 일주일, 사소한 일에 예민해지거나\n짜증이 난 날은 며칠인가요?",
    options: [
      { label: "0~1일", score: 1 },
      { label: "2~3일", score: 2 },
      { label: "4~5일", score: 3 },
      { label: "6~7일", score: 4 },
    ],
  },
  {
    id: "Q3", axis: "청정", reverse: true,
    text: "최근 일주일, 창문을 열어 환기한 횟수는\n총 몇 번인가요?",
    options: [
      { label: "0~1회",    score: 4 },
      { label: "2~4회",    score: 3 },
      { label: "5~9회",    score: 2 },
      { label: "10회 이상", score: 1 },
    ],
  },
  {
    id: "Q4", axis: "몰입", reverse: false,
    text: "최근 일주일, 업무나 공부 중 한 번에\n집중을 유지한 시간은 보통 얼마나 되나요?",
    options: [
      { label: "60분 이상",  score: 1 },
      { label: "30~60분",    score: 2 },
      { label: "15~30분",    score: 3 },
      { label: "15분 미만",  score: 4 },
    ],
  },
  {
    id: "Q5", axis: "활력", reverse: false,
    text: "최근 일주일, 오후(2~5시)에 눈에 띄게\n기운이 떨어진 날은 며칠인가요?",
    options: [
      { label: "0~1일", score: 1 },
      { label: "2~3일", score: 2 },
      { label: "4~5일", score: 3 },
      { label: "6~7일", score: 4 },
    ],
  },
  {
    id: "Q6", axis: "숙면", reverse: false,
    text: "최근 일주일, 자다가 한 번이라도 깬 밤은\n며칠인가요?",
    options: [
      { label: "0~1일", score: 1 },
      { label: "2~3일", score: 2 },
      { label: "4~5일", score: 3 },
      { label: "6~7일", score: 4 },
    ],
  },
  {
    id: "Q7", axis: "청정", reverse: false,
    text: "최근 일주일, 주로 머무는 실내 공간의\n공기가 답답하다고 느낀 날은 며칠인가요?",
    options: [
      { label: "0~1일", score: 1 },
      { label: "2~3일", score: 2 },
      { label: "4~5일", score: 3 },
      { label: "6~7일", score: 4 },
    ],
  },
  {
    id: "Q8", axis: "이완", reverse: true,
    text: "최근 일주일, 하루를 마친 저녁에\n\"긴장이 풀렸다\"고 느낀 날은 며칠인가요?",
    options: [
      { label: "0~1일", score: 4 },
      { label: "2~3일", score: 3 },
      { label: "4~5일", score: 2 },
      { label: "6~7일", score: 1 },
    ],
  },
  {
    id: "Q9", axis: "활력", reverse: true,
    text: "최근 일주일, 커피나 에너지드링크를\n하루 2잔 이상 마신 날은 며칠인가요?",
    options: [
      { label: "6~7일", score: 4 },
      { label: "4~5일", score: 3 },
      { label: "2~3일", score: 2 },
      { label: "0~1일", score: 1 },
    ],
  },
  {
    id: "Q10", axis: "몰입", reverse: false,
    text: "최근 일주일, 스마트폰 알림이나 메시지 때문에\n하던 일이 끊긴 횟수는 하루 평균 몇 번인가요?",
    options: [
      { label: "2회 이하",   score: 1 },
      { label: "3~5회",      score: 2 },
      { label: "6~10회",     score: 3 },
      { label: "11회 이상",  score: 4 },
    ],
  },
  {
    id: "Q11", axis: "숙면", reverse: true,
    text: "최근 일주일, 아침에 일어났을 때\n\"잘 잤다\"고 느낀 날은 며칠인가요?",
    options: [
      { label: "0~1일", score: 4 },
      { label: "2~3일", score: 3 },
      { label: "4~5일", score: 2 },
      { label: "6~7일", score: 1 },
    ],
  },
  {
    id: "Q12", axis: "청정", reverse: false,
    text: "최근 일주일, 코나 목이 건조하거나\n불편했던 날은 며칠인가요?",
    options: [
      { label: "0~1일", score: 1 },
      { label: "2~3일", score: 2 },
      { label: "4~5일", score: 3 },
      { label: "6~7일", score: 4 },
    ],
  },
  {
    id: "Q13", axis: "활력", reverse: false,
    text: "최근 일주일, 낮 동안 특별한 이유 없이\n몸이 무겁다고 느낀 날은 며칠인가요?",
    options: [
      { label: "0~1일", score: 1 },
      { label: "2~3일", score: 2 },
      { label: "4~5일", score: 3 },
      { label: "6~7일", score: 4 },
    ],
  },
  {
    id: "Q14", axis: "이완", reverse: false,
    text: "최근 일주일, 어깨나 목이 뻐근하다고\n느낀 날은 며칠인가요?",
    options: [
      { label: "0~1일", score: 1 },
      { label: "2~3일", score: 2 },
      { label: "4~5일", score: 3 },
      { label: "6~7일", score: 4 },
    ],
  },
  {
    id: "Q15", axis: "몰입", reverse: true,
    text: "최근 일주일, 여러 일을 동시에 처리하느라\n하나에 집중하기 어려웠던 날은 며칠인가요?",
    options: [
      { label: "6~7일", score: 4 },
      { label: "4~5일", score: 3 },
      { label: "2~3일", score: 2 },
      { label: "0~1일", score: 1 },
    ],
  },
];

// ------------------------------------------------------------------
// Part B — 취향 · 안전 · 프로파일 (5문항)
// 동점 처리·필터의 입력값 — 추천 엔진의 필수 입력
// ------------------------------------------------------------------

export const SCENT_CATEGORIES: ScentCategoryV2[] = [
  "시트러스",
  "플로럴",
  "우디·머스크",
  "허브·그린",
  "스파이시·오리엔탈",
];

export const SPACES: SpaceV2[] = [
  "침실",
  "거실·주방",
  "사무실·작업공간",
  "차량",
  "기타",
];

export const SAFETY_FLAGS: { key: SafetyFlagV2; label: string }[] = [
  { key: "알레르기",   label: "향이나 화장품에 알레르기·피부 트러블 경험 있음" },
  { key: "임신·수유", label: "임신 또는 수유 중" },
  { key: "어린이",    label: "어린이와 함께 생활" },
  { key: "반려동물",  label: "반려동물과 함께 생활" },
];

export const AGE_GROUPS = ["10대", "20대", "30대", "40대", "50대", "60대 이상"] as const;
export type AgeGroupV2 = (typeof AGE_GROUPS)[number];

// ------------------------------------------------------------------
// 축-문항 매핑 (점수 계산에 사용)
// ------------------------------------------------------------------

export const AXIS_QUESTIONS: Record<AxisV2, string[]> = {
  숙면: ["Q1", "Q6", "Q11"],
  이완: ["Q2", "Q8", "Q14"],
  활력: ["Q5", "Q9", "Q13"],
  몰입: ["Q4", "Q10", "Q15"],
  청정: ["Q3", "Q7", "Q12"],
};

// 역방향 문항 목록 (straight-lining 탐지에 사용)
export const REVERSE_QUESTION_IDS = new Set(
  PART_A_QUESTIONS.filter((q) => q.reverse).map((q) => q.id)
); // Q3, Q8, Q9, Q11, Q15
