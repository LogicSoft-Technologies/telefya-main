import { apiRequest } from "@/lib/api/client";
import type { ApiResponse } from "@/types/auth";

export type BillingPlanCode = "free" | "pro" | "business" | "enterprise";

export type BillingPlan = {
  code: BillingPlanCode;
  name: string;
  description?: string | null;
  price_cents_monthly: number;
  currency: string;
  interval?: "month" | "year";
  max_meeting_minutes: number;
  max_participants: number;
  monthly_recording_minutes: number;
  storage_gb: number;
  recording_enabled: boolean;
  analytics_enabled: boolean;
  priority_support: boolean;
  sort_order?: number;
};

export type BillingLimits = {
  max_meeting_minutes: number;
  max_participants: number;
  monthly_recording_minutes: number;
  storage_gb: number;
  recording_enabled: boolean;
  analytics_enabled: boolean;
  priority_support: boolean;
};

export type BillingSubscription = {
  user_id: string;
  plan_code: BillingPlanCode;
  plan_name: string;
  status:
    | "free"
    | "incomplete"
    | "trialing"
    | "active"
    | "past_due"
    | "unpaid"
    | "cancelled"
    | "expired";
  provider: "system" | "manual" | "stripe" | string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  limits: BillingLimits;
};

export type BillingUsage = {
  id?: string | number;
  user_id: string;
  period_start: string;
  period_end: string;
  meeting_minutes_used: number;
  recording_minutes_used: number;
  storage_bytes_used: number;
};

export type CheckoutSession = {
  url: string;
  sessionId?: string;
  setupRequired?: boolean;
  subscription?: BillingSubscription;
};

export type BillingPortalSession = {
  url: string;
  setupRequired?: boolean;
};

export type Invoice = {
  id: string;
  amount: string;
  status: "paid" | "open" | "void" | "failed";
  created_at: string;
};

export function formatPlanPrice(plan: BillingPlan) {
  if (plan.code === "enterprise" || plan.price_cents_monthly === null) {
    return "Custom";
  }

  if (!plan.price_cents_monthly) {
    return "$0";
  }

  return `$${(plan.price_cents_monthly / 100).toFixed(0)}`;
}

export function listBillingPlans() {
  return apiRequest<ApiResponse<BillingPlan[]>>("/billing/plans", {
    method: "GET",
  });
}

export function getCurrentSubscription(token?: string | null) {
  return apiRequest<ApiResponse<BillingSubscription>>("/billing/current", {
    method: "GET",
    authToken: token,
  });
}

export function getBillingUsage(token?: string | null) {
  return apiRequest<ApiResponse<BillingUsage>>("/billing/usage", {
    method: "GET",
    authToken: token,
  });
}

export function createCheckoutSession(
  planCode: BillingPlanCode,
  token?: string | null,
) {
  return apiRequest<ApiResponse<CheckoutSession>>("/billing/checkout", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ planCode }),
  });
}

export function createBillingPortalSession(token?: string | null) {
  return apiRequest<ApiResponse<BillingPortalSession>>("/billing/portal", {
    method: "POST",
    authToken: token,
  });
}

/**
 * Backward-compatible helpers for existing pages.
 */
export function getCurrentPlan(token: string) {
  return getCurrentSubscription(token);
}

export function listInvoices(token: string) {
  return apiRequest<ApiResponse<Invoice[]>>("/billing/invoices", {
    method: "GET",
    authToken: token,
  });
}