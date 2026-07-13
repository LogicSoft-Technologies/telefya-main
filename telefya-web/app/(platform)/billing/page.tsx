"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  Database,
  Loader2,
  ShieldCheck,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createBillingPortalSession,
  createCheckoutSession,
  formatPlanPrice,
  getBillingUsage,
  getCurrentSubscription,
  listBillingPlans,
  type BillingPlan,
  type BillingPlanCode,
  type BillingSubscription,
  type BillingUsage,
} from "@/lib/api/billing";
import { getAccessToken } from "@/lib/auth/tokens";

function formatBytes(bytes?: number) {
  const value = bytes || 0;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function percent(used: number, limit: number) {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export default function BillingPage() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const token = typeof window === "undefined" ? "" : getAccessToken();

  const currentPlan = useMemo(() => {
    return plans.find((plan) => plan.code === subscription?.plan_code) || null;
  }, [plans, subscription]);

  async function loadBilling() {
    setLoading(true);
    setError("");

    try {
      const [plansResult, subResult, usageResult] = await Promise.all([
        listBillingPlans(),
        getCurrentSubscription(token),
        getBillingUsage(token),
      ]);

      setPlans(plansResult.data || []);
      setSubscription(subResult.data || null);
      setUsage(usageResult.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load billing.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBilling();
  }, []);

  async function startCheckout(planCode: BillingPlanCode) {
    setAction(planCode);
    setNotice("");
    setError("");

    try {
      const response = await createCheckoutSession(planCode, token);
      const url = response.data?.url;

      if (!url) throw new Error(response.message || "Unable to start checkout.");

      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
      setAction("");
    }
  }

  async function openPortal() {
    setAction("portal");
    setNotice("");
    setError("");

    try {
      const response = await createBillingPortalSession(token);
      const url = response.data?.url;

      if (!url) throw new Error(response.message || "Unable to open billing portal.");

      if (response.data?.setupRequired) {
        setNotice("Stripe portal is not configured yet. Your billing foundation is ready.");
        setAction("");
        return;
      }

      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open billing portal.");
      setAction("");
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-[calc(100vh-68px)] place-items-center">
        <div className="flex items-center gap-3 text-sm font-black text-navy-600">
          <Loader2 size={20} className="animate-spin text-telefya-blue" />
          Loading billing...
        </div>
      </main>
    );
  }

  const recordingStorageLimitBytes =
    Number(subscription?.limits.storage_gb || 0) * 1024 * 1024 * 1024;

  const storageUsed = Number(usage?.storage_bytes_used || 0);
  const recordingMinutesUsed = Number(usage?.recording_minutes_used || 0);
  const recordingMinutesLimit = Number(subscription?.limits.monthly_recording_minutes || 0);

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-enterprise">
        <div className="telefya-accent-line h-1.5" />

        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_auto] xl:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-navy-300">
              Billing
            </p>
            <h1 className="mt-3 text-4xl font-black text-navy-900">
              Plan, limits, and usage.
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-navy-500">
              Manage your Telefya subscription and see how your workspace is using
              meeting and recording capacity.
            </p>
          </div>

          <button
            onClick={openPortal}
            disabled={action === "portal"}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 text-sm font-black text-white hover:bg-telefya-blue disabled:opacity-60"
          >
            {action === "portal" ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />}
            Manage billing
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
          {notice}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <article className="rounded-3xl border border-border bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
                Current plan
              </p>
              <h2 className="mt-2 text-3xl font-black text-navy-900">
                {subscription?.plan_name || "Free"}
              </h2>
              <p className="mt-2 text-sm font-semibold text-navy-500">
                Status: {subscription?.status || "free"}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-right">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-telefya-blue">
                Price
              </p>
              <p className="mt-1 text-2xl font-black text-navy-900">
                {currentPlan ? formatPlanPrice(currentPlan) : "$0"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <LimitCard icon={Video} label="Meeting length" value={`${subscription?.limits.max_meeting_minutes || 40}m`} />
            <LimitCard icon={ShieldCheck} label="Participants" value={String(subscription?.limits.max_participants || 4)} />
            <LimitCard icon={Database} label="Storage" value={`${subscription?.limits.storage_gb || 0}GB`} />
          </div>
        </article>

        <article className="rounded-3xl border border-border bg-white p-6 shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
            This period
          </p>

          <div className="mt-5 grid gap-5">
            <UsageBar
              label="Recording minutes"
              value={`${recordingMinutesUsed} / ${recordingMinutesLimit || 0}m`}
              percent={percent(recordingMinutesUsed, recordingMinutesLimit)}
            />

            <UsageBar
              label="Storage"
              value={`${formatBytes(storageUsed)} / ${subscription?.limits.storage_gb || 0}GB`}
              percent={percent(storageUsed, recordingStorageLimitBytes)}
            />
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-border bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
              Upgrade
            </p>
            <h2 className="mt-2 text-2xl font-black text-navy-900">
              Choose a plan
            </h2>
          </div>

          <Link
            href="/choose-plan"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-black text-navy-800 hover:border-telefya-blue hover:text-telefya-blue"
          >
            Compare plans
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <article
              key={plan.code}
              className="flex min-h-[240px] flex-col rounded-2xl border border-border bg-navy-50 p-4"
            >
              <h3 className="text-lg font-black text-navy-900">{plan.name}</h3>
              <p className="mt-1 text-sm font-semibold text-navy-500">
                {plan.max_participants} participants · {plan.max_meeting_minutes}m calls
              </p>

              <p className="mt-5 text-3xl font-black text-navy-900">
                {formatPlanPrice(plan)}
              </p>

              <button
                onClick={() => startCheckout(plan.code)}
                disabled={action === plan.code || subscription?.plan_code === plan.code}
                className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-3 text-sm font-black text-white hover:bg-telefya-violet disabled:cursor-not-allowed disabled:opacity-50"
              >
                {action === plan.code ? <Loader2 size={16} className="animate-spin" /> : null}
                {subscription?.plan_code === plan.code ? "Current plan" : "Choose"}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function LimitCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Video;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-navy-50 p-4">
      <Icon size={20} className="text-telefya-blue" />
      <p className="mt-4 text-2xl font-black text-navy-900">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-navy-400">
        {label}
      </p>
    </div>
  );
}

function UsageBar({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div className="flex justify-between gap-3 text-sm font-black">
        <span className="text-navy-700">{label}</span>
        <span className="text-navy-400">{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-100">
        <div
          className="h-full rounded-full bg-telefya-blue"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}