import type { CoachPlan } from "@/src/types";

export interface CoachPlanMeta {
  label: string;
  cap: number;
  price: string;
}

export const COACH_PLANS: Record<CoachPlan, CoachPlanMeta> = {
  free: { label: "Free", cap: 2, price: "R$ 0" },
  basic: { label: "Básico", cap: 5, price: "R$ 59/mês" },
  plus: { label: "Plus", cap: 10, price: "R$ 75/mês" },
  premier: { label: "Premier", cap: 20, price: "R$ 100/mês" },
};

export function getCoachPlanMeta(plan?: CoachPlan | null): CoachPlanMeta {
  return plan ? COACH_PLANS[plan] : COACH_PLANS.free;
}
