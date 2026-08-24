import type { ScentType } from "./scentQuestions";

export const SCENT_COLORS: Record<ScentType, string> = {
  이완: "#4D0E12",
  숙면: "#231815",
  활력: "#D2BF81",
  몰입: "#4A2E27",
  청정: "#A5BCD6",
};

export interface ScentReference {
  title: string;
  url: string;
}

export interface ScentResult {
  type: ScentType;
  subtitle: string;
  description: string;
  traits: string[];
  scents: {
    name: string;
    note: string;
    usage: string;
    evidence: string;
    emoji: string;
    sourceTitle?: string;
    sourceUrl?: string;
    tier: "low" | "mid" | "high";
  }[];
  evidenceLevel: string;
  references: ScentReference[];
  color: string;
}

export const scentResults: Record<ScentType, ScentResult> = {
  이완: {
    type: "이완",
    subtitle: "긴장을 자주 짊어지고 사는 타입",
    description: "최근 스트레스와 긴장이 몸에 쌓여 있는 상태예요.\n사소한 일에도 예민해지고,\n어깨나 목이 자주 뻐근하다면 이완이 필요한 신호입니다.",
    traits: ["긴장도 높음", "예민함 증가", "완전히 쉬는 시간 부족"],
    scents: [
      // tier low (0~33점): 심화 케어
      {
        name: "네롤리",
        note: "오렌지꽃에서 증류한 희귀 플로럴, 달콤·쌉싸름",
        usage: "손목 롤온 또는 디퓨저 1~2방울",
        evidence: "폐경 여성 대상 RCT에서 흡입 후 타액 코르티솔·수축기혈압 유의 감소. 이완 관련 향 중 가장 강력한 호르몬 수준 변화 확인",
        emoji: "🌸",
        sourceTitle: "네롤리 흡입이 폐경기 여성의 스트레스·코르티솔에 미치는 영향 (RCT)",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/24858276/",
        tier: "low",
      },
      {
        name: "클라리세이지",
        note: "견과류·허브 복합의 낯선 향, 라벤더보다 강함",
        usage: "저녁 목욕 후 흡입 또는 디퓨저",
        evidence: "간호사 대상 연구에서 흡입 후 혈청 코르티솔 유의 감소 및 우울 점수 개선 보고",
        emoji: "🌿",
        tier: "low",
      },
      // tier mid (34~66점)
      {
        name: "프티그레인",
        note: "오렌지 잎·나뭇가지의 맑은 우디·허브향",
        usage: "업무 중 디퓨저, 소량 흡입",
        evidence: "자율신경계 이완 반응 유도 보고, 라벤더보다 덜 알려졌으나 유사 기전 연구 존재",
        emoji: "🍃",
        tier: "mid",
      },
      {
        name: "베르가못 FCF",
        note: "광독성 제거 처리된 베르가못, 피부 안전",
        usage: "낮 시간 디퓨저 또는 손목 롤온",
        evidence: "혼합 오일 연구에서 스트레스 지표(혈압·맥박·코르티솔) 개선에 기여",
        emoji: "🍋",
        sourceTitle: "라벤더·일랑일랑·베르가못 혼합오일 흡입과 혈압·코르티솔 변화",
        sourceUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3521421/",
        tier: "mid",
      },
      // tier high (67~100점)
      {
        name: "스위트오렌지",
        note: "밝고 익숙한 시트러스",
        usage: "업무 중 데스크 디퓨저",
        evidence: "아동 대상 RCT에서 흡입 후 타액 코르티솔·맥박수 유의 감소",
        emoji: "🍊",
        sourceTitle: "스위트오렌지 흡입이 아동 코르티솔·맥박수에 미치는 영향 (RCT)",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/23930255/",
        tier: "high",
      },
      {
        name: "라벤더",
        note: "이완의 클래식",
        usage: "손목 롤온 또는 베개 스프레이",
        evidence: "다수 RCT에서 혈압·맥박·불안 지표 개선 보고",
        emoji: "💜",
        tier: "high",
      },
    ],
    evidenceLevel: "근거 수준: 높음",
    references: [
      { title: "Neroli oil inhalation on cortisol & blood pressure in menopausal women (RCT)", url: "https://pubmed.ncbi.nlm.nih.gov/24858276/" },
      { title: "Essential oil inhalation on blood pressure and cortisol (RCT)", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3521421/" },
    ],
    color: "#4D0E12",
  },

  숙면: {
    type: "숙면",
    subtitle: "잠이 부족하고 얕은 타입",
    description: "잠들기까지 오래 걸리거나 자주 깨고,\n일어나도 개운하지 않다면 수면의 질을 채워줄 향이 필요한 상태예요.",
    traits: ["입면 시간 김", "얕은 수면", "기상 후 피로감"],
    scents: [
      // tier low
      {
        name: "발레리안",
        note: "흙·나무·발효향, 강렬하고 낯선 허브향",
        usage: "취침 1시간 전 침실 디퓨저 또는 베개 1방울",
        evidence: "16개 임상 메타분석에서 수면의 질 향상·입면 시간 단축 유의 효과 보고. 향 중 수면 근거 가장 풍부",
        emoji: "🌾",
        sourceTitle: "발레리안 수면 효과 체계적 문헌고찰 및 메타분석",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/16335660/",
        tier: "low",
      },
      {
        name: "시더우드 아틀라스",
        note: "모로코산 삼나무, 묵직한 우디·스모키향",
        usage: "취침 30분 전 흡입 또는 디퓨저",
        evidence: "주성분 세드롤(Cedrol)이 수면 지속 시간 연장·각성 억제에 영향을 준다는 생리 연구 보고",
        emoji: "🌲",
        tier: "low",
      },
      // tier mid
      {
        name: "로만 캐모마일",
        note: "독일 캐모마일과 다른 달콤한 사과향, 훨씬 부드러움",
        usage: "베개 스프레이 또는 흡입",
        evidence: "대학생 불면증 대상 연구에서 수면의 질·낮 졸음 개선 보고",
        emoji: "🌼",
        sourceTitle: "불면증 청년 대상 캐모마일 오일 흡입과 수면의 질 개선 연구",
        sourceUrl: "https://journals.sagepub.com/doi/abs/10.1177/00912174241301279",
        tier: "mid",
      },
      {
        name: "마조람",
        note: "후추·허브 복합의 따뜻하고 낯선 향",
        usage: "저녁 디퓨저 또는 온찜질팩에 1방울",
        evidence: "진정·부교감신경 활성화 효과 보고, 전통 수면 허브로 수면 준비 단계에 활용",
        emoji: "🌿",
        tier: "mid",
      },
      // tier high
      {
        name: "라벤더",
        note: "숙면의 대표 향",
        usage: "취침 30분 전 침실 디퓨저",
        evidence: "심부전 환자 8주 RCT 등 다수에서 수면의 질 유의 개선",
        emoji: "💜",
        sourceTitle: "만성심부전 환자 대상 라벤더 흡입과 수면의 질 개선 연구",
        sourceUrl: "https://doi.org/10.1093/eurjcn/zvag006",
        tier: "high",
      },
      {
        name: "만다린",
        note: "라벤더보다 가볍고 달콤한 시트러스",
        usage: "저녁 기분 전환용 디퓨저",
        evidence: "진정·긴장 완화 효과로 수면 준비 단계에 보조적으로 활용",
        emoji: "🍊",
        tier: "high",
      },
    ],
    evidenceLevel: "근거 수준: 높음",
    references: [
      { title: "Valerian for sleep: a systematic review and meta-analysis", url: "https://pubmed.ncbi.nlm.nih.gov/16335660/" },
      { title: "Lavender essential oil inhalation on sleep quality in chronic heart failure patients (RCT)", url: "https://doi.org/10.1093/eurjcn/zvag006" },
    ],
    color: "#231815",
  },

  활력: {
    type: "활력",
    subtitle: "에너지가 쉽게 바닥나는 타입",
    description: "오후만 되면 무기력해지고 아침에 눈뜨기 힘들다면,\n몸을 깨우는 향으로 리듬을 되찾을 수 있어요.",
    traits: ["오후 슬럼프", "기상 어려움", "카페인 의존"],
    scents: [
      // tier low
      {
        name: "블랙페퍼",
        note: "자극적이고 낯선 스파이시 각성향",
        usage: "아침 손목 롤온 또는 흡입 스틱",
        evidence: "흡입 시 교감신경 활성화·혈류 증가 보고, 니코틴 금단 연구에서 각성·구강 만족감 대체 효과 확인",
        emoji: "🌶️",
        sourceTitle: "블랙페퍼 향 흡입이 금연 중 갈망·각성에 미치는 영향",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/7793641/",
        tier: "low",
      },
      {
        name: "카다몸",
        note: "인도 허브향, 스파이시·달콤 복합",
        usage: "아침 디퓨저",
        evidence: "흡입 시 각성 지표 개선 및 호흡기 청량감 보고, 아유르베다 전통 자극 허브로 활용",
        emoji: "🌿",
        tier: "low",
      },
      // tier mid
      {
        name: "그레이프프루트",
        note: "상큼하고 쌉싸름한 시트러스",
        usage: "오후 슬럼프 시간대 디퓨저",
        evidence: "흡입 시 교감신경 활성화 및 지방 분해 효소 자극 관련 연구 보고",
        emoji: "🍇",
        sourceTitle: "자몽 향 흡입과 교감신경·지방분해 활성화 연구",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/18981011/",
        tier: "mid",
      },
      {
        name: "스페어민트",
        note: "페퍼민트보다 부드러운 민트향, 당도감 있음",
        usage: "집중 작업 전 짧게 흡입",
        evidence: "노섬브리아대 연구에서 작업 기억·정보처리 속도 향상, 운동 피로 감소 보고",
        emoji: "🌱",
        tier: "mid",
      },
      // tier high
      {
        name: "로즈마리",
        note: "허브 향의 각성감",
        usage: "슬럼프 시간대 디퓨저",
        evidence: "1,8-시네올 성분이 각성·인지수행과 상관관계 있다는 연구 보고",
        emoji: "🌿",
        sourceTitle: "로즈마리 향 흡입 농도와 인지수행 상관관계 연구",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/23983963/",
        tier: "high",
      },
      {
        name: "페퍼민트",
        note: "시원하고 청량한 민트",
        usage: "휴대용 인헤일러 스틱",
        evidence: "주의력·반응속도·주관적 각성도 향상 대조 연구 다수",
        emoji: "🌱",
        sourceTitle: "페퍼민트 향의 인지수행·기분 비교 대조연구",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/18041606/",
        tier: "high",
      },
    ],
    evidenceLevel: "근거 수준: 중간~높음",
    references: [
      { title: "Modulation of cognitive performance and mood by aromas of peppermint and ylang-ylang", url: "https://pubmed.ncbi.nlm.nih.gov/18041606/" },
      { title: "Plasma 1,8-cineole correlates with cognitive performance following exposure to rosemary aroma", url: "https://pubmed.ncbi.nlm.nih.gov/23983963/" },
    ],
    color: "#D2BF81",
  },

  몰입: {
    type: "몰입",
    subtitle: "집중이 자주 끊기는 타입",
    description: "한 가지 일에 집중하기 어렵고 화면 사용 시간이 길다면,\n몰입을 도와주는 향으로 작업 흐름을 지켜보세요.",
    traits: ["짧은 집중 지속시간", "잦은 멀티태스킹", "긴 화면 사용시간"],
    scents: [
      // tier low
      {
        name: "베티버",
        note: "뿌리 증류, 흙·스모키·깊은 우디향. 매우 낯선 향",
        usage: "작업 전 손목 1방울 또는 디퓨저 소량",
        evidence: "주의력결핍 아동 대상 파일럿 연구에서 집중력 관련 뇌파(β파) 지표 개선 보고",
        emoji: "🌾",
        tier: "low",
      },
      {
        name: "바질 CT 리나롤",
        note: "일반 바질과 다른 달콤·플로럴 허브향, 피자 바질이 아님",
        usage: "집중 작업 전 짧게 흡입",
        evidence: "정신 피로 감소 및 작업 집중력 개선 연구 존재, 동남아 전통 각성 허브로 활용",
        emoji: "🌿",
        tier: "low",
      },
      // tier mid
      {
        name: "레몬",
        note: "맑고 산뜻한 시트러스",
        usage: "업무 공간 디퓨저",
        evidence: "일본 사무실 연구에서 레몬 향 환경의 타이핑 오류율 54% 감소 보고",
        emoji: "🍋",
        sourceTitle: "레몬·재스민 향기가 사무 환경 스트레스와 타이핑 정확도에 미치는 영향",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/18412601/",
        tier: "mid",
      },
      {
        name: "프랑킨센스",
        note: "유향나무 수지향, 명상·영적 집중의 향",
        usage: "심호흡 명상과 함께 흡입",
        evidence: "신경보호 성분(보스웰릭산) 연구 보고, 전통적으로 명상·집중력 향상에 활용",
        emoji: "🕯️",
        tier: "mid",
      },
      // tier high
      {
        name: "로즈마리",
        note: "기억력·집중 보조",
        usage: "업무 시작 전 짧게 디퓨징",
        evidence: "인지수행과 관련된 성분(1,8-시네올) 연구 보고",
        emoji: "🌿",
        sourceTitle: "로즈마리 향 흡입 농도와 인지수행 상관관계 연구",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/23983963/",
        tier: "high",
      },
      {
        name: "페퍼민트",
        note: "각성과 집중의 클래식",
        usage: "책상 디퓨저 또는 롤온",
        evidence: "지속주의 과제·반응속도·작업기억 향상 대조 연구 다수",
        emoji: "🌱",
        sourceTitle: "페퍼민트·일랑일랑 향의 인지수행·기분 비교 대조연구",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/18041606/",
        tier: "high",
      },
    ],
    evidenceLevel: "근거 수준: 중간~높음",
    references: [
      { title: "Modulation of cognitive performance and mood by aromas of peppermint and ylang-ylang", url: "https://pubmed.ncbi.nlm.nih.gov/18041606/" },
      { title: "Plasma 1,8-cineole correlates with cognitive performance following exposure to rosemary aroma", url: "https://pubmed.ncbi.nlm.nih.gov/23983963/" },
    ],
    color: "#4A2E27",
  },

  청정: {
    type: "청정",
    subtitle: "실내공기·호흡기가 예민한 타입",
    description: "환기가 부족하거나 미세먼지에 컨디션이 쉽게 흔들린다면,\n공기를 정돈해주는 향으로 쾌적함을 더해보세요.",
    traits: ["잦은 환기 부족", "미세먼지 민감", "가벼운 호흡기 불편"],
    scents: [
      // tier low
      {
        name: "라빈차라",
        note: "마다가스카르산 희귀 캠퍼·유칼립투스향",
        usage: "환기 후 디퓨저, 취침 전 흡입",
        evidence: "1,8-시네올 85% 이상 함유, 유칼립투스보다 자극 적고 항바이러스·호흡기 지원 성분 농도 높음",
        emoji: "🌿",
        tier: "low",
      },
      {
        name: "스코치파인",
        note: "유럽 소나무의 레진·우디향, 산림욕 향",
        usage: "실내 공기 정화용 디퓨저",
        evidence: "α-피넨 성분이 기도 점막 자극 완화 및 거담 작용과 관련된 연구 보고",
        emoji: "🌲",
        tier: "low",
      },
      // tier mid
      {
        name: "머틀",
        note: "지중해 허브의 청량한 수렴향, 유칼립투스보다 부드러움",
        usage: "아침 흡입 또는 환기 시 디퓨저",
        evidence: "COPD 환자 대상 연구에서 기침·점액 완화 효과 보고",
        emoji: "🍃",
        sourceTitle: "머틀 오일의 만성 호흡기 증상 완화 연구",
        sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/19422597/",
        tier: "mid",
      },
      {
        name: "니아울리",
        note: "호주산 희귀 캠퍼·허브향, 티트리 계열",
        usage: "환기 전후 룸 스프레이",
        evidence: "티트리 계열 항균·항바이러스 활성 및 호흡기 점막 지원 연구 보고",
        emoji: "🌿",
        tier: "mid",
      },
      // tier high
      {
        name: "유칼립투스",
        note: "청량하고 깨끗한 향",
        usage: "실내 디퓨저",
        evidence: "블렌드 스프레이 RCT에서 상기도 불편감 완화 보고",
        emoji: "🍃",
        sourceTitle: "아로마 허브 스프레이의 상기도감염 증상 완화 무작위대조연구",
        sourceUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2967840/",
        tier: "high",
      },
      {
        name: "티트리",
        note: "깔끔한 허브향",
        usage: "환기 전후 룸 스프레이",
        evidence: "공기 중 인플루엔자 바이러스 불활성화 연구 보고",
        emoji: "🌿",
        sourceTitle: "티트리·유칼립투스 오일의 공기 중 인플루엔자 바이러스 불활성화 연구",
        sourceUrl: "https://www.tandfonline.com/doi/full/10.1080/02786826.2012.708948",
        tier: "high",
      },
    ],
    evidenceLevel: "근거 수준: 중간~높음",
    references: [
      { title: "Treatment of upper respiratory tract infections using aromatic herb spray (RCT)", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2967840/" },
      { title: "Inactivation of airborne influenza virus by tea tree and eucalyptus oils", url: "https://www.tandfonline.com/doi/full/10.1080/02786826.2012.708948" },
    ],
    color: "#A5BCD6",
  },
};

export const SCENT_GROUPS: Record<ScentType, "active" | "calm"> = {
  몰입: "active",
  활력: "active",
  청정: "active",
  이완: "calm",
  숙면: "calm",
};

export const SCENT_DISCLAIMER =
  "아로마테라피는 치료 수단이 아닙니다.\n임산부, 영유아, 지병이 있는 경우 사용 전 전문가와 상담하세요.";
