/**
 * Feature gate system for FREE and PRO plans.
 * All gate checks run locally. No billing implemented yet —
 * ready to wire to RevenueCat or StoreKit when needed.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type Plan = "FREE" | "PRO";

const PLAN_STORAGE_KEY = "@taqqafi_plan";

export const FREE_LIMITS = {
  maxBudgets: 3,
  maxPendingHistory: 50,
  hasExport: false,
  hasSmsBankWhitelist: false,
  hasAdvancedAnalytics: false,
};

export const PRO_FEATURES = {
  maxBudgets: Infinity,
  maxPendingHistory: Infinity,
  hasExport: true,
  hasSmsBankWhitelist: true,
  hasAdvancedAnalytics: true,
};

export async function getCurrentPlan(): Promise<Plan> {
  try {
    const stored = await AsyncStorage.getItem(PLAN_STORAGE_KEY);
    return (stored as Plan) ?? "FREE";
  } catch {
    return "FREE";
  }
}

export async function setPlan(plan: Plan): Promise<void> {
  await AsyncStorage.setItem(PLAN_STORAGE_KEY, plan);
}

export function canAddBudget(currentCount: number, plan: Plan): boolean {
  if (plan === "PRO") return true;
  return currentCount < FREE_LIMITS.maxBudgets;
}

export function getFeatures(plan: Plan) {
  return plan === "PRO" ? PRO_FEATURES : FREE_LIMITS;
}

export function isPro(plan: Plan): boolean {
  return plan === "PRO";
}
