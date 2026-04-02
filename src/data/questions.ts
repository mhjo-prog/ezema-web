export interface Question {
  id: number;
  category: string;
  text: string;
  options: {
    id: string;
    text: string;
    /** A=태양인 / B=태음인 / C=소양인 / D=소음인 */
    scores: Record<string, number>;
  }[];
}

const S = (a: number, b: number, c: number, d: number) => ({
  태양인: a,
  소양인: b,
  태음인: c,
  소음인: d,
});

// 스코어 헬퍼: A=태양인, B=태음인, C=소양인, D=소음인
const A = S(1, 0, 0, 0); // 태양인
const B = S(0, 0, 1, 0); // 태음인
const C = S(0, 1, 0, 0); // 소양인
const D = S(0, 0, 0, 1); // 소음인

export const questions: Question[] = [
  // ── 외모·건강 (Q1~Q13) ──
  {
    id: 1,
    category: "외모 · 건강",
    text: "체구는 어떤가요?",
    options: [
      { id: "a", text: "목덜미가 굵고 허리 부위가 가늘다", scores: A },
      { id: "b", text: "허리 부위가 굵고 목덜미가 가늘다", scores: B },
      { id: "c", text: "가슴 부위가 넓고 엉덩이 부위가 작다", scores: C },
      { id: "d", text: "엉덩이 부위가 넓고 가슴 부위가 좁다", scores: D },
    ],
  },
  {
    id: 2,
    category: "외모 · 건강",
    text: "체격은 어떤가요?",
    options: [
      { id: "a", text: "건장하고 어깨가 발달했다", scores: A },
      { id: "b", text: "살집이 있고 체구가 큰 편이다", scores: B },
      { id: "c", text: "날렵하고 가슴 부위가 발달했다", scores: C },
      { id: "d", text: "왜소하고 체구가 작다", scores: D },
    ],
  },
  {
    id: 3,
    category: "외모 · 건강",
    text: "몸에서 외관상 가장 발달되거나 큰 부분은?",
    options: [
      { id: "a", text: "머리와 목", scores: A },
      { id: "b", text: "허리와 옆구리", scores: B },
      { id: "c", text: "가슴", scores: C },
      { id: "d", text: "엉덩이", scores: D },
    ],
  },
  {
    id: 4,
    category: "외모 · 건강",
    text: "얼굴은 다음 중 어디에 가장 가깝나요?",
    options: [
      { id: "a", text: "광대뼈가 나왔고, 이마가 넓다", scores: A },
      { id: "b", text: "이목구비가 큼직하고, 얼굴 윤곽이 뚜렷하다", scores: B },
      { id: "c", text: "턱이 뾰족하고, 이마가 튀어나왔다", scores: C },
      { id: "d", text: "이목구비가 작고 오밀조밀하며, 갸름하다", scores: D },
    ],
  },
  {
    id: 5,
    category: "외모 · 건강",
    text: "얼굴의 색깔은 어떤가요?",
    options: [
      { id: "a", text: "맑고 투명한 편(광채)", scores: A },
      { id: "b", text: "어둡거나 황색", scores: B },
      { id: "c", text: "붉은 기(홍조)", scores: C },
      { id: "d", text: "희고 창백한 편", scores: D },
    ],
  },
  {
    id: 6,
    category: "외모 · 건강",
    text: "눈빛은 어디에 가장 가깝나요?",
    options: [
      { id: "a", text: "강렬하다", scores: A },
      { id: "b", text: "깊고 안정적이다", scores: B },
      { id: "c", text: "반짝거리고 예리하다", scores: C },
      { id: "d", text: "부드럽고 차분하다", scores: D },
    ],
  },
  {
    id: 7,
    category: "외모 · 건강",
    text: "걸음걸이나 움직임은 어떤 스타일인가요?",
    options: [
      { id: "a", text: "걸음걸이가 꼿꼿하다", scores: A },
      { id: "b", text: "걸음이 느리고 무게 있게 걷는다", scores: B },
      { id: "c", text: "걸음걸이가 빠르고, 가볍게 걷는 느낌이다", scores: C },
      { id: "d", text: "보폭이 좁고 얌전하게 걷는다", scores: D },
    ],
  },
  {
    id: 8,
    category: "외모 · 건강",
    text: "언제 건강 상태가 좋음을 느끼나요?",
    options: [
      { id: "a", text: "소변의 양이 많고 잘 나올 때", scores: A },
      { id: "b", text: "땀이 잘 나올 때", scores: B },
      { id: "c", text: "대변이 잘 나올 때", scores: C },
      { id: "d", text: "소화가 잘 될 때", scores: D },
    ],
  },
  {
    id: 9,
    category: "외모 · 건강",
    text: "컨디션이 나빠질 때 먼저 나타나는 증상은?",
    options: [
      { id: "a", text: "다리 힘 빠짐 + 피곤함", scores: A },
      { id: "b", text: "땀 감소 + 얼굴 부음", scores: B },
      { id: "c", text: "변비 + 가슴 답답함", scores: C },
      { id: "d", text: "소화불량 + 손발이 차가워짐", scores: D },
    ],
  },
  {
    id: 10,
    category: "외모 · 건강",
    text: "감기 증상은?",
    options: [
      { id: "a", text: "마른기침이 나며, 다리에 힘이 빠진다", scores: A },
      { id: "b", text: "몸살이 심한데 식은땀은 나지 않는다", scores: B },
      { id: "c", text: "열이 나고 목이 아프며 땀이 난다", scores: C },
      { id: "d", text: "오한이 심하고 소화불량까지 온다", scores: D },
    ],
  },
  {
    id: 11,
    category: "외모 · 건강",
    text: "수면 패턴은?",
    options: [
      { id: "a", text: "수면이 부족해도 크게 피곤하지 않다", scores: A },
      { id: "b", text: "잠이 많고 깊게 자는 편이다", scores: B },
      { id: "c", text: "몸에 열이 많아 뒤척이는 편이다", scores: C },
      { id: "d", text: "잠들기 어렵고 깨면 다시 잠들기 어렵다", scores: D },
    ],
  },
  {
    id: 12,
    category: "외모 · 건강",
    text: "평소 자주 느끼는 몸의 증상은?",
    options: [
      { id: "a", text: "머리 무거움·어지러움", scores: A },
      { id: "b", text: "근육 떨림·쥐", scores: B },
      { id: "c", text: "한숨·가슴 답답", scores: C },
      { id: "d", text: "심장 두근거림·눈 피로", scores: D },
    ],
  },
  {
    id: 13,
    category: "외모 · 건강",
    text: "말투나 목소리는 어떤 편인가요?",
    options: [
      { id: "a", text: "날카롭고 힘 있으며, 말수가 적다", scores: A },
      { id: "b", text: "목소리가 굵고 낮으며, 무게감이 있다", scores: B },
      { id: "c", text: "말이 또렷하고, 표현이 명확하다", scores: C },
      { id: "d", text: "말투가 부드럽고 차분하며, 목소리가 작은 편이다", scores: D },
    ],
  },

  // ── 소화·음식 (Q14~Q21) ──
  {
    id: 14,
    category: "소화 · 음식",
    text: "식사 속도와 식사량은 어떤 편인가요?",
    options: [
      { id: "a", text: "기름진 것보다는 담백한 것을 선호하며, 식욕이 크지 않다", scores: A },
      { id: "b", text: "음식을 가리지 않고 아주 복스럽고 많이 먹는 편이다", scores: B },
      { id: "c", text: "양보다는 맛, 새로운 음식을 즐기고 먹는 속도가 빠르다", scores: C },
      { id: "d", text: "입이 짧고 식사량이 적으며, 천천히 먹는 편이다", scores: D },
    ],
  },
  {
    id: 15,
    category: "소화 · 음식",
    text: "소화 상태에 따른 컨디션 변화는 어떠한가요?",
    options: [
      { id: "a", text: "평소에 소화가 잘 안되며, 육류보다는 채소나 해산물이 편하다", scores: A },
      { id: "b", text: "과식을 해도 소화가 잘되며, 배가 든든해야 기운이 나고 일이 잘된다", scores: B },
      { id: "c", text: "먹고 돌아서면 금방 배가 고픈 편이며, 찬 음료를 마셔야 속이 시원하다", scores: C },
      { id: "d", text: "조금만 과식하거나 신경을 쓰면 체하기 쉽고, 소화가 잘 되어야 컨디션이 좋다", scores: D },
    ],
  },
  {
    id: 16,
    category: "소화 · 음식",
    text: "평소 선호하거나 몸에 잘 맞는 음식의 온도는?",
    options: [
      { id: "a", text: "냉수보다는 적당히 시원한 온도의 맑은 차나 음료가 몸에 잘 맞는다", scores: A },
      { id: "b", text: "찬 것이나 뜨거운 것이나 가리지 않고 다 잘 먹으며 소화에 무리가 없다", scores: B },
      { id: "c", text: "얼음이 들어간 물/음료/음식을 마셔야 속이 시원하고 갈증이 해소된다", scores: C },
      { id: "d", text: "찬 것을 먹으면 배가 아프거나 설사를 하기 쉬워, 항상 따뜻한 음식을 찾는다", scores: D },
    ],
  },
  {
    id: 17,
    category: "소화 · 음식",
    text: "몸에 잘 안 맞는 음식은?",
    options: [
      { id: "a", text: "기름진 음식(육류 등)", scores: A },
      { id: "b", text: "특별히 없음", scores: B },
      { id: "c", text: "밀가루 음식(면, 빵)", scores: C },
      { id: "d", text: "날것&차가운 음식(회, 냉면 등)", scores: D },
    ],
  },
  {
    id: 18,
    category: "소화 · 음식",
    text: "식사 후 나타나는 특징적인 반응은?",
    options: [
      { id: "a", text: "가끔 음식이 목에 걸린 듯 답답하거나 입안에 침이 자주 고이는 느낌이 있다", scores: A },
      { id: "b", text: "밥을 먹고 나면 몸이 무거워지고 잠이 쏟아져 한참을 쉬어야 한다", scores: B },
      { id: "c", text: "밥을 먹으면 에너지가 바로 충전되는 느낌이다", scores: C },
      { id: "d", text: "소화가 느려 밥 먹고 나면 배가 빵빵해지거나 가스가 자주 차서 불편하다", scores: D },
    ],
  },
  {
    id: 19,
    category: "소화 · 음식",
    text: "특별히 당기거나 '소울 푸드'라고 생각하는 음식은?",
    options: [
      { id: "a", text: "전복, 조개, 메밀국수처럼 담백하고 깔끔한 맛을 선호한다", scores: A },
      { id: "b", text: "소고기 등 기름지고 든든한 고기 요리를 먹어야 기운이 난다", scores: B },
      { id: "c", text: "맵고 자극적인 요리나 화려한 퓨전 요리 등 새로운 맛을 즐긴다", scores: C },
      { id: "d", text: "따뜻한 된장찌개나 찰밥처럼 속을 편안하게 해주는 한식을 좋아한다", scores: D },
    ],
  },
  {
    id: 20,
    category: "소화 · 음식",
    text: "대변의 상태는 어떤가요?",
    options: [
      { id: "a", text: "평소에 원활하지만, 조금만 막혀도 몸이 확 불편하다", scores: A },
      { id: "b", text: "대변이 굵고 양이 많으며 시원하게 잘 나오는 편이다", scores: B },
      { id: "c", text: "변이 건조하고 딱딱해 자주 변비가 생긴다", scores: C },
      { id: "d", text: "변이 묽고 소화 상태에 따라 설사가 잦은 편이다", scores: D },
    ],
  },
  {
    id: 21,
    category: "소화 · 음식",
    text: "술을 마시면 몸의 반응은?",
    options: [
      { id: "a", text: "다리에 힘이 풀린다", scores: A },
      { id: "b", text: "술을 마셔도 큰 변화가 없다", scores: B },
      { id: "c", text: "얼굴이 빨개지고 열이 난다", scores: C },
      { id: "d", text: "조금만 마셔도 속이 불편하다", scores: D },
    ],
  },

  // ── 성격·심리 (Q22~Q30) ──
  {
    id: 22,
    category: "성격 · 심리",
    text: "일을 할 때 어떻게 처리하나요?",
    options: [
      { id: "a", text: "막힘 없이 시원스럽게 한다", scores: A },
      { id: "b", text: "끝까지 꾸준하게 한다", scores: B },
      { id: "c", text: "창의적이고 솔직하다", scores: C },
      { id: "d", text: "세밀하고 꼼꼼하게 한다", scores: D },
    ],
  },
  {
    id: 23,
    category: "성격 · 심리",
    text: "자신과 가장 비슷한 모습은?",
    options: [
      { id: "a", text: "진취적이고 추진력이 강하다", scores: A },
      { id: "b", text: "행동력은 느리지만 꾸준하다", scores: B },
      { id: "c", text: "여러 일을 벌여놓고 마무리는 약하다", scores: C },
      { id: "d", text: "행동보다 사색하기를 좋아한다", scores: D },
    ],
  },
  {
    id: 24,
    category: "성격 · 심리",
    text: "나는 어디에 해당하나요?",
    options: [
      { id: "a", text: "생각보다 몸이 먼저 움직인다", scores: A },
      { id: "b", text: "변화를 싫어한다", scores: B },
      { id: "c", text: "새로운 것을 찾으려 한다", scores: C },
      { id: "d", text: "신중하게 따져보려 한다", scores: D },
    ],
  },
  {
    id: 25,
    category: "성격 · 심리",
    text: "당신은 어떤 성향을 지니고 있나요?",
    options: [
      { id: "a", text: "과거의 일에 미련이 별로 없다", scores: A },
      { id: "b", text: "크고 넓게 포용할 수 있다", scores: B },
      { id: "c", text: "갈등을 피하고 싶어 속으로 삼킨다", scores: C },
      { id: "d", text: "세밀하고 정확하게 일을 한다", scores: D },
    ],
  },
  {
    id: 26,
    category: "성격 · 심리",
    text: "이중에서 무엇을 중요하게 생각하나요?",
    options: [
      { id: "a", text: "권력", scores: A },
      { id: "b", text: "돈과 재물", scores: B },
      { id: "c", text: "명예", scores: C },
      { id: "d", text: "사회적 지위", scores: D },
    ],
  },
  {
    id: 27,
    category: "성격 · 심리",
    text: "당신이 가지고 있는 성품은?",
    options: [
      { id: "a", text: "카리스마로 좌중을 압도하며, 사람들을 가르치고 이끄는 데 능하다", scores: A },
      { id: "b", text: "성격이 원만하고 평온하여, 사람들 사이의 갈등을 잘 달래고 화합시킨다", scores: B },
      { id: "c", text: "전달력이 명확하고, 누구와도 금방 어울린다", scores: C },
      { id: "d", text: "그릇이 넓어 웬만한 일은 웃으며 넘기고, 사람을 귀하게 대접한다", scores: D },
    ],
  },
  {
    id: 28,
    category: "성격 · 심리",
    text: "마음속에 자주 드는 생각은?",
    options: [
      { id: "a", text: "하고 싶은 일을 못 하면 억울하고 분하다", scores: A },
      { id: "b", text: "탐하는 마음이 계속될까봐 스스로가 두렵다", scores: B },
      { id: "c", text: "내 것을 지키고 싶지만, 부족한 거 같아 불안하다", scores: C },
      { id: "d", text: "하고 싶은 일을 할 수 있어서 즐겁다", scores: D },
    ],
  },
  {
    id: 29,
    category: "성격 · 심리",
    text: "사람을 판단할 때에 무엇을 기준으로 보나요?",
    options: [
      { id: "a", text: "선과 악", scores: A },
      { id: "b", text: "근면과 게으름", scores: B },
      { id: "c", text: "지혜와 어리석음", scores: C },
      { id: "d", text: "능력과 무능함", scores: D },
    ],
  },
  {
    id: 30,
    category: "성격 · 심리",
    text: "자신의 성격과 일치하는 것은?",
    options: [
      { id: "a", text: "옳지 않은 것을 보면 참지 못한다", scores: A },
      { id: "b", text: "느긋하며 잘 받아들인다", scores: B },
      { id: "c", text: "낯선 사람들과도 쉽게 어울린다", scores: C },
      { id: "d", text: "정확하고 빈틈없이 일을 처리한다", scores: D },
    ],
  },
];
