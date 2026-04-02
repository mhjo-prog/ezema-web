export interface ConstitutionResult {
  type: string;
  subtitle: string;
  description: string;
  traits: string[];
  drinks: {
    name: string;
    description: string;
    emoji: string;
  }[];
  lifestyle: string[];
  color: string;
  accentColor: string;
}

export const results: Record<string, ConstitutionResult> = {
  태양인: {
    type: "태양인",
    subtitle: "태양의 기운을 타고난 선구자",
    description:
      "강한 카리스마와 추진력을 가진 리더형 체질입니다. 창의적이고 혁신적인 아이디어로 앞을 개척해 나가지만, 과도한 에너지 소비로 쉽게 지칠 수 있습니다.",
    traits: ["사교성 뛰어남", "직관력 강함", "리더십 있음", "공정함 중시"],
    drinks: [
      { name: "모과차", description: "근육 이완 & 소화 촉진, 간 기능 보호", emoji: "🍈" },
      { name: "오가피차", description: "근골 강화 & 간 기능 보완, 피로 회복", emoji: "🌿" },
      { name: "솔잎차", description: "혈액순환 개선 & 항산화 효과", emoji: "🌲" },
      { name: "감잎차", description: "면역력 강화 & 노폐물 배출, 간 기능 보호", emoji: "🍃" },
    ],
    lifestyle: [
      "생선, 조개류, 채소 위주로 가볍게 먹기",
      "기름지고 맵고 뜨거운 음식은 줄이기",
      "포도, 수박, 키위처럼 시원한 과일 즐겨 먹기",
      "분노가 치밀 때 잠깐 멈추고 여유 갖는 연습하기",
      "혼자 모든 걸 해결하려 하지 말고 주변에 의지하기",
    ],
    color: "#1a0a2e",
    accentColor: "#9333ea",
  },
  소양인: {
    type: "소양인",
    subtitle: "활동과 열정으로 빛나는 에너자이저",
    description:
      "활발하고 사교적인 성격으로 어디서나 주목받는 에너지형 체질입니다. 빠른 판단력과 행동력이 강점이지만, 지속적인 집중이 어려울 수 있습니다.",
    traits: ["행동력 강함", "감각 예민함", "일 처리 빠름", "활발하고 외향적"],
    drinks: [
      { name: "구기자차", description: "신장 음기 보충 & 하체 허약 개선", emoji: "🍇" },
      { name: "결명자차", description: "체내 열 내리기 & 눈 건강, 간 기능 보호", emoji: "🌾" },
      { name: "보리차", description: "소화 촉진 & 체열 조절, 이뇨 작용", emoji: "🌿" },
      { name: "녹차", description: "항산화 & 체내 열 내리고 집중력 향상", emoji: "🍵" },
    ],
    lifestyle: [
      "신선한 채소와 해산물 위주로 시원하게 먹기",
      "맵고 뜨거운 음식은 몸에 열이 쌓이므로 피하기",
      "산수유·구기자·복분자로 하체 건강 챙기기",
      "충동적인 결정 전에 한 번 더 생각하는 습관 들이기",
      "뒤로 물러날 줄 아는 마음으로 오래 가는 관계 만들기",
    ],
    color: "#0a1a2e",
    accentColor: "#0ea5e9",
  },
  태음인: {
    type: "태음인",
    subtitle: "깊고 묵직한 대지의 에너지",
    description:
      "꾸준하고 인내심이 강한 실행가형 체질입니다. 한번 마음먹은 것은 끝까지 해내는 추진력과 풍부한 감수성을 가지고 있으며,\n안정적인 환경에서 최대 역량을 발휘합니다.",
    traits: ["끈기와 인내심 강함", "감수성 풍부함", "시작하면 끝까지", "안정 추구"],
    drinks: [
      { name: "율무차", description: "붓기 제거 & 신진대사 활성화", emoji: "🌾" },
      { name: "맥문동차", description: "폐와 기관지 강화 & 건조함 완화", emoji: "🫐" },
      { name: "칡차", description: "해열 & 발한 촉진, 노폐물 배출", emoji: "🌿" },
      { name: "오미자차", description: "피로 회복 & 폐 기능 보강", emoji: "🍒" },
    ],
    lifestyle: [
      "땀이 잘 나는 유산소 운동 꾸준히 하기",
      "먹고 싶은 게 많은 체질이니 소식하는 습관 들이기",
      "기름지고 자극적인 음식은 줄이기",
      "쌓인 감정을 밖으로 표현하는 연습하기 (감정 묵히지 않기)",
      "넓은 시야를 갖고 변화에 유연하게 대처하기",
    ],
    color: "#0a1a0a",
    accentColor: "#22c55e",
  },
  소음인: {
    type: "소음인",
    subtitle: "섬세함과 깊이를 가진 내면의 탐구자",
    description:
      "세심하고 감수성이 풍부한 사색가형 체질입니다. 깊은 생각과 정교한 감각으로 주변을 이해하지만, 냉기에 약하고 소화 기능이 예민할 수 있습니다.",
    traits: ["꼼꼼하고 세심함", "깊은 인간관계 중시", "논리적 사고", "작은 것도 놓치지 않음"],
    drinks: [
      { name: "생강차", description: "위장 따뜻하게 & 냉증 완화, 소화 촉진", emoji: "🫚" },
      { name: "인삼차(홍삼)", description: "원기 회복 & 소화기 보강, 면역력 강화", emoji: "🌱" },
      { name: "대추차", description: "위를 따뜻하게 & 소화기 강화, 불안 완화", emoji: "🌰" },
      { name: "쌍화차", description: "기력 회복 & 혈액순환 개선, 냉증 완화", emoji: "🍂" },
    ],
    lifestyle: [
      "따뜻하게 조리된 음식으로 몸 속부터 따뜻하게",
      "차갑거나 날것의 음식은 배탈 날 수 있으니 피하기",
      "닭고기, 찹쌀, 생강 등 따뜻한 성질 식재료 활용하기",
      "지나친 걱정과 불안은 내려놓고 현재에 집중하기",
      "작은 성취도 스스로 인정하며 자신감 키우기",
    ],
    color: "#1a0a0a",
    accentColor: "#f97316",
  },
};
