export type ScentType = "이완" | "숙면" | "활력" | "몰입" | "청정";
export type Axis = ScentType;

export type Facet =
  | "onset" | "maintain" | "morning" | "rhythm"
  | "physical" | "emotional" | "autonomic" | "recovery"
  | "afternoon" | "wakeup" | "fatigue" | "caffeine"
  | "duration" | "distract" | "switch" | "screen"
  | "airway" | "sensitive" | "stuffy" | "hygiene";

export const AXIS_FACETS: Record<Axis, Facet[]> = {
  숙면: ["onset", "maintain", "morning", "rhythm"],
  이완: ["emotional", "physical", "autonomic", "recovery"],
  활력: ["afternoon", "wakeup", "fatigue", "caffeine"],
  몰입: ["duration", "distract", "switch", "screen"],
  청정: ["airway", "sensitive", "stuffy", "hygiene"],
};

export const FACET_LABELS: Record<Facet, string> = {
  onset:     "쉽게 잠들지 못하는 밤",
  maintain:  "밤중에 자주 깨는 잠",
  morning:   "개운하지 않은 아침",
  rhythm:    "들쑥날쑥한 수면 시간",
  physical:  "뻐근한 어깨와 목",
  emotional: "쉽게 예민해지는 마음",
  autonomic: "두근거리고 답답한 가슴",
  recovery:  "잘 풀리지 않는 하루의 긴장",
  afternoon: "오후에 훅 떨어지는 에너지",
  wakeup:    "눈 뜨기 힘든 아침",
  fatigue:   "이유 없이 무거운 몸",
  caffeine:  "커피 없이는 버티기 힘든 하루",
  duration:  "오래가지 못하는 집중력",
  distract:  "자꾸 끊기는 집중의 흐름",
  switch:    "여러 일을 동시에 하는 하루",
  screen:    "하루 종일 보는 화면",
  airway:    "막힌 코와 간질거리는 목",
  sensitive: "미세먼지에 민감한 몸",
  stuffy:    "답답하게 느껴지는 실내 공기",
  hygiene:   "자주 하지 못하는 환기",
};

export interface ScentQuestion {
  id: number;
  category: string;
  text: string;
  facet: Facet;
  options: {
    id: string;
    text: string;
    scores: Partial<Record<ScentType, number>>;
  }[];
}

const s = (type: ScentType, value: number): Partial<Record<ScentType, number>> => ({ [type]: value });

export const scentQuestions: ScentQuestion[] = [
  { id: 1, category: "수면 패턴", text: "어제 잠자리에 누운 뒤 잠들기까지\n얼마나 걸렸나요?", facet: "onset", options: [
    { id: "a", text: "10분 이내", scores: s("숙면", 4) },
    { id: "b", text: "10~20분", scores: s("숙면", 3) },
    { id: "c", text: "20~40분", scores: s("숙면", 2) },
    { id: "d", text: "40분 이상", scores: s("숙면", 1) },
  ]},
  { id: 2, category: "수면 패턴", text: "최근 일주일 동안 자다가 중간에\n깨는 일이 얼마나 잦았나요?", facet: "maintain", options: [
    { id: "a", text: "거의 없다", scores: s("숙면", 4) },
    { id: "b", text: "1~2회", scores: s("숙면", 3) },
    { id: "c", text: "3~4회", scores: s("숙면", 2) },
    { id: "d", text: "거의 매일", scores: s("숙면", 1) },
  ]},
  { id: 3, category: "수면 패턴", text: "최근 일주일 동안 아침에 눈을 떴을 때\n개운한 느낌이 들었나요?", facet: "morning", options: [
    { id: "a", text: "항상 개운하다", scores: s("숙면", 4) },
    { id: "b", text: "대체로 개운하다", scores: s("숙면", 3) },
    { id: "c", text: "대체로 찌뿌둥하다", scores: s("숙면", 2) },
    { id: "d", text: "항상 피곤하다", scores: s("숙면", 1) },
  ]},
  { id: 4, category: "수면 패턴", text: "최근 일주일 동안 수면 시간이\n불규칙했던 날이 얼마나 되나요?", facet: "rhythm", options: [
    { id: "a", text: "거의 없다", scores: s("숙면", 4) },
    { id: "b", text: "1~2일", scores: s("숙면", 3) },
    { id: "c", text: "3~4일", scores: s("숙면", 2) },
    { id: "d", text: "거의 매일", scores: s("숙면", 1) },
  ]},
  { id: 5, category: "스트레스 · 긴장", text: "최근 일주일 동안 사소한 일에도\n예민하거나 짜증이 난 적이 있나요?", facet: "emotional", options: [
    { id: "a", text: "없다", scores: s("이완", 4) },
    { id: "b", text: "가끔", scores: s("이완", 3) },
    { id: "c", text: "자주", scores: s("이완", 2) },
    { id: "d", text: "거의 매일", scores: s("이완", 1) },
  ]},
  { id: 6, category: "스트레스 · 긴장", text: "최근 일주일 동안 어깨나 목이\n뻐근하다고 느낀 날이 얼마나 되나요?", facet: "physical", options: [
    { id: "a", text: "없다", scores: s("이완", 4) },
    { id: "b", text: "1~2일", scores: s("이완", 3) },
    { id: "c", text: "3~4일", scores: s("이완", 2) },
    { id: "d", text: "거의 매일", scores: s("이완", 1) },
  ]},
  { id: 7, category: "스트레스 · 긴장", text: "최근 일주일 동안 심장이 이유 없이\n두근거리거나 답답한 적이 있었나요?", facet: "autonomic", options: [
    { id: "a", text: "없다", scores: s("이완", 4) },
    { id: "b", text: "1~2회", scores: s("이완", 3) },
    { id: "c", text: "3~4회", scores: s("이완", 2) },
    { id: "d", text: "5회 이상", scores: s("이완", 1) },
  ]},
  { id: 8, category: "스트레스 · 긴장", text: "어제 저녁, 하루를 마치고 완전히\n긴장이 풀렸다는 느낌을 받았나요?", facet: "recovery", options: [
    { id: "a", text: "그렇다", scores: s("이완", 4) },
    { id: "b", text: "대체로 그렇다", scores: s("이완", 3) },
    { id: "c", text: "별로 그렇지 않았다", scores: s("이완", 2) },
    { id: "d", text: "전혀 그렇지 않았다", scores: s("이완", 1) },
  ]},
  { id: 9, category: "활동량 · 피로도", text: "최근 일주일 동안 오후에 집중력이\n급격히 떨어진 날이 얼마나 되나요?", facet: "afternoon", options: [
    { id: "a", text: "거의 없다", scores: s("활력", 4) },
    { id: "b", text: "1~2일", scores: s("활력", 3) },
    { id: "c", text: "3~4일", scores: s("활력", 2) },
    { id: "d", text: "거의 매일", scores: s("활력", 1) },
  ]},
  { id: 10, category: "활동량 · 피로도", text: "최근 일주일 동안 아침에 눈을 뜨는 것\n자체가 힘들게 느껴졌나요?", facet: "wakeup", options: [
    { id: "a", text: "전혀 아니다", scores: s("활력", 4) },
    { id: "b", text: "가끔", scores: s("활력", 3) },
    { id: "c", text: "자주", scores: s("활력", 2) },
    { id: "d", text: "거의 매일", scores: s("활력", 1) },
  ]},
  { id: 11, category: "활동량 · 피로도", text: "최근 일주일 동안 특별히 무리하지 않았는데도\n몸이 무겁게 느껴진 날이 얼마나 되나요?", facet: "fatigue", options: [
    { id: "a", text: "거의 없다", scores: s("활력", 4) },
    { id: "b", text: "1~2일", scores: s("활력", 3) },
    { id: "c", text: "3~4일", scores: s("활력", 2) },
    { id: "d", text: "거의 매일", scores: s("활력", 1) },
  ]},
  { id: 12, category: "활동량 · 피로도", text: "최근 일주일 동안 카페인(커피 등)에 의존해\n하루를 버틴 날이 얼마나 되나요?", facet: "caffeine", options: [
    { id: "a", text: "거의 없다", scores: s("활력", 4) },
    { id: "b", text: "1~2일", scores: s("활력", 3) },
    { id: "c", text: "3~4일", scores: s("활력", 2) },
    { id: "d", text: "거의 매일", scores: s("활력", 1) },
  ]},
  { id: 13, category: "집중 · 업무환경", text: "어제 한 가지 작업에 방해 없이\n집중할 수 있었던 시간은 얼마나 되나요?", facet: "duration", options: [
    { id: "a", text: "1시간 이상", scores: s("몰입", 4) },
    { id: "b", text: "30분~1시간", scores: s("몰입", 3) },
    { id: "c", text: "15~30분", scores: s("몰입", 2) },
    { id: "d", text: "15분 미만", scores: s("몰입", 1) },
  ]},
  { id: 14, category: "집중 · 업무환경", text: "어제 일하는 동안 스마트폰·다른 생각으로\n흐름이 끊긴 일이 얼마나 있었나요?", facet: "distract", options: [
    { id: "a", text: "거의 없었다", scores: s("몰입", 4) },
    { id: "b", text: "가끔", scores: s("몰입", 3) },
    { id: "c", text: "자주", scores: s("몰입", 2) },
    { id: "d", text: "매우 자주", scores: s("몰입", 1) },
  ]},
  { id: 15, category: "집중 · 업무환경", text: "최근 일주일 동안 여러 가지 일을 동시에\n처리해야 하는 상황이 얼마나 있었나요?", facet: "switch", options: [
    { id: "a", text: "거의 없다", scores: s("몰입", 4) },
    { id: "b", text: "가끔", scores: s("몰입", 3) },
    { id: "c", text: "자주", scores: s("몰입", 2) },
    { id: "d", text: "항상 그렇다", scores: s("몰입", 1) },
  ]},
  { id: 16, category: "집중 · 업무환경", text: "어제 화면(모니터·스마트폰)을 본\n시간은 대략 얼마나 되나요?", facet: "screen", options: [
    { id: "a", text: "4시간 미만", scores: s("몰입", 4) },
    { id: "b", text: "4~7시간", scores: s("몰입", 3) },
    { id: "c", text: "7~10시간", scores: s("몰입", 2) },
    { id: "d", text: "10시간 이상", scores: s("몰입", 1) },
  ]},
  { id: 17, category: "실내환경 · 호흡기", text: "최근 일주일 동안 창문을 열어\n환기한 횟수는 얼마나 되나요?", facet: "hygiene", options: [
    { id: "a", text: "5회 이상", scores: s("청정", 4) },
    { id: "b", text: "3회 이상", scores: s("청정", 3) },
    { id: "c", text: "1~2회", scores: s("청정", 2) },
    { id: "d", text: "0회", scores: s("청정", 1) },
  ]},
  { id: 18, category: "실내환경 · 호흡기", text: "미세먼지가 심한 날, 컨디션이나\n목 상태가 나빠지나요?", facet: "sensitive", options: [
    { id: "a", text: "전혀 아니다", scores: s("청정", 4) },
    { id: "b", text: "약간 그렇다", scores: s("청정", 3) },
    { id: "c", text: "꽤 그렇다", scores: s("청정", 2) },
    { id: "d", text: "매우 그렇다", scores: s("청정", 1) },
  ]},
  { id: 19, category: "실내환경 · 호흡기", text: "최근 일주일 동안 코막힘, 목 간지러움 등\n가벼운 호흡기 불편을 느낀 빈도는?", facet: "airway", options: [
    { id: "a", text: "거의 없다", scores: s("청정", 4) },
    { id: "b", text: "가끔", scores: s("청정", 3) },
    { id: "c", text: "자주", scores: s("청정", 2) },
    { id: "d", text: "거의 매일", scores: s("청정", 1) },
  ]},
  { id: 20, category: "실내환경 · 호흡기", text: "최근 일주일 동안 실내(사무실·집)에서\n공기가 답답하거나 탁하다고 느낀 빈도는?", facet: "stuffy", options: [
    { id: "a", text: "거의 없다", scores: s("청정", 4) },
    { id: "b", text: "가끔", scores: s("청정", 3) },
    { id: "c", text: "자주", scores: s("청정", 2) },
    { id: "d", text: "항상 그렇다", scores: s("청정", 1) },
  ]},
];
