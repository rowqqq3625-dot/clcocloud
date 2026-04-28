export const pricingPlans = [
  {
    name: "베이직",
    label: "₩98,000",
    balance: 200,
    price: 98000,
    discount: 64,
    note: "오푸스 4.7 사용제한",
    popular: false,
    tokens: 25,
    hours: 80
  },
  {
    name: "프로",
    label: "₩196,000",
    balance: 500,
    price: 196000,
    discount: 72,
    note: "가장 많이 선택",
    popular: true,
    tokens: 50,
    hours: 200
  },
  {
    name: "울트라",
    label: "₩264,000",
    balance: 1000,
    price: 264000,
    discount: 81,
    note: "장기 프로젝트용",
    popular: false,
    tokens: 100,
    hours: 400
  }
] as const;

export const pricingPlansWithDiscount = pricingPlans;

export const maxDiscount = Math.max(...pricingPlans.map((plan) => plan.discount));
