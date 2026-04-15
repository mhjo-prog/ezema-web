import type { Post } from "../lib/supabase";

export const samplePosts: Post[] = [
  {
    id: "sample-1",
    title: "태음인이 꼭 알아야 할 수면 습관",
    content: `태음인은 체력이 강하고 지구력이 뛰어나지만, 폐 기능이 약해 수면의 질이 떨어지기 쉽습니다.

태음인에게 이상적인 수면 시간은 7~8시간이며, 취침 전 과식은 피해야 합니다. 몸에 열이 많아 침실을 서늘하게 유지하는 것이 숙면에 도움됩니다.

취침 1시간 전 스마트폰을 내려놓고, 가벼운 스트레칭으로 몸을 이완시켜 보세요. 꾸준한 수면 루틴이 태음인의 건강을 지키는 핵심입니다.`,
    card_image_url: "https://images.unsplash.com/photo-1541480601022-2308c0f02487?w=600",
    constitution_type: "태음인",
    status: "published",
    scheduled_at: null,
    view_count: 0,
    created_at: "2026-04-01T09:30:00Z",
  },
  {
    id: "sample-2",
    title: "소음인의 소화력을 높이는 아침 루틴",
    content: `소음인은 소화기관이 약하고 차가운 기운을 가지고 있어 아침 식사가 특히 중요합니다.

일어나자마자 따뜻한 물 한 잔으로 위장을 깨워주세요. 아침 식사는 따뜻하고 부드러운 음식 위주로, 생채소나 찬 음식은 피하는 것이 좋습니다.

식후에는 바로 눕지 말고 10분 정도 가볍게 걷는 것이 소화를 돕습니다. 소음인에게는 규칙적인 식사 시간을 지키는 것이 무엇보다 중요합니다.`,
    card_image_url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600",
    constitution_type: "소음인",
    status: "published",
    scheduled_at: null,
    view_count: 0,
    created_at: "2026-04-02T09:30:00Z",
  },
  {
    id: "sample-3",
    title: "태양인에게 맞는 감정 조절법",
    content: `태양인은 폐 기능이 매우 발달하고 창의력이 뛰어나지만, 간 기능이 약해 분노와 스트레스에 취약합니다.

감정이 격해질 때는 깊은 호흡을 통해 즉각적인 반응을 늦추는 연습이 필요합니다. 자연 속 산책이나 명상은 태양인의 흥분된 기운을 가라앉히는 데 효과적입니다.

타인과의 소통을 즐기되, 혼자만의 시간도 충분히 확보하세요. 감정 일기를 쓰는 것도 자신의 패턴을 이해하는 데 도움이 됩니다.`,
    card_image_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600",
    constitution_type: "태양인",
    status: "published",
    scheduled_at: null,
    view_count: 0,
    created_at: "2026-04-03T09:30:00Z",
  },
  {
    id: "sample-4",
    title: "소양인의 열을 다스리는 음식 가이드",
    content: `소양인은 비장 기능이 발달하고 활동적이지만, 신장 기능이 약하고 몸에 열이 많습니다.

소양인에게는 서늘한 성질의 음식이 좋습니다. 오이, 수박, 참외, 배 등 수분이 풍부한 과일과 채소를 충분히 섭취하세요.

맵고 뜨거운 음식, 기름진 음식은 열을 더 올려 피부 트러블이나 소화 문제를 일으킬 수 있습니다. 물을 자주 마시고 과식을 피하는 것이 핵심입니다.`,
    card_image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
    constitution_type: "소양인",
    status: "published",
    scheduled_at: null,
    view_count: 0,
    created_at: "2026-04-04T09:30:00Z",
  },
  {
    id: "sample-5",
    title: "태음인 체질에 맞는 운동법",
    content: `태음인은 선천적으로 체력이 강하고 근육이 잘 발달하지만, 땀을 충분히 내지 않으면 노폐물이 쌓이기 쉽습니다.

태음인에게 가장 좋은 운동은 충분한 땀을 낼 수 있는 유산소 운동입니다. 달리기, 수영, 자전거 등이 적합하며 운동 후 충분한 수분 보충이 필수입니다.

꾸준함이 중요한 태음인은 매일 30분 이상의 운동 습관을 들이면 체중 관리와 면역력 향상에 큰 효과를 볼 수 있습니다.`,
    card_image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600",
    constitution_type: "태음인",
    status: "published",
    scheduled_at: null,
    view_count: 0,
    created_at: "2026-04-05T09:30:00Z",
  },
  {
    id: "sample-6",
    title: "소음인이 피해야 할 음식들",
    content: `소음인은 소화 기능이 약하고 몸이 차가워 음식 선택에 특별한 주의가 필요합니다.

차가운 음식(아이스크림, 냉면, 찬 음료)은 위장 기능을 더욱 약하게 만들 수 있습니다. 날 것의 채소나 과일보다는 익혀서 먹는 것이 소화에 부담을 줄여줍니다.

카페인이 많은 커피나 녹차도 소음인의 예민한 소화계에 자극을 줄 수 있어 주의가 필요합니다. 따뜻하고 담백한 음식으로 속을 편안하게 유지하세요.`,
    card_image_url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600",
    constitution_type: "소음인",
    status: "published",
    scheduled_at: null,
    view_count: 0,
    created_at: "2026-04-06T09:30:00Z",
  },
];
