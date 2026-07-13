"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  Crown,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  createCheckoutSession,
  formatPlanPrice,
  listBillingPlans,
  type BillingPlan,
  type BillingPlanCode,
} from "@/lib/api/billing";
import { getAccessToken } from "@/lib/auth/tokens";

const planHighlights: Record<BillingPlanCode, string[]> = {
  free: [
    "Up to 4 participants",
    "40-minute group meetings",
    "Chat and screen sharing",
  ],
  pro: [
    "Up to 50 participants",
    "5-hour meetings",
    "Recording and analytics",
  ],
  business: [
    "Up to 100 participants",
    "12-hour meetings",
    "Priority support and admin controls",
  ],
  enterprise: [
    "Custom capacity",
    "Advanced support",
    "Enterprise governance",
  ],
};

export default function ChoosePlanPage() {
  return (
    <Suspense>
      <ChoosePlanContent />
    </Suspense>
  );
}

function ChoosePlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedFromUrl = searchParams.get("plan") as BillingPlanCode | null;

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [actionPlan, setActionPlan] = useState("");
  const [error, setError] = useState("");

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  }, [plans]);

  useEffect(() => {
    async function loadPlans() {
      setLoadingPlans(true);
      setError("");

      try {
        const response = await listBillingPlans();
        setPlans(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load plans.");
      } finally {
        setLoadingPlans(false);
      }
    }

    loadPlans();
  }, []);

  async function choosePlan(planCode: BillingPlanCode) {
    const token = getAccessToken();

    if (!token) {
      router.push(`/login?next=${encodeURIComponent(`/choose-plan?plan=${planCode}`)}`);
      return;
    }

    setActionPlan(planCode);
    setError("");

    try {
      const response = await createCheckoutSession(planCode, token);
      const url = response.data?.url;

      if (!url) {
        throw new Error(response.message || "Unable to start checkout.");
      }

      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
      setActionPlan("");
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="grid min-h-screen lg:grid-cols-[420px_1fr] xl:grid-cols-[480px_1fr]">
        <aside className="hidden overflow-hidden bg-navy-900 lg:flex lg:flex-col">
          <div className="telefya-accent-line h-1" />

          <div className="flex flex-1 flex-col justify-between px-8 py-10">
            <Link
              href="/"
              className="inline-flex w-fit rounded-xl bg-white px-4 py-3 shadow-soft"
            >
              <Image
                src="/images/telefya-logo.png"
                alt="Telefya"
                width={152}
                height={46}
                priority
                className="h-9 w-auto"
              />
            </Link>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/70">
                <ShieldCheck size={15} className="text-telefya-green" />
                Billing-ready workspace
              </div>

              <h1 className="mt-6 max-w-md text-4xl font-black leading-tight text-white">
                Choose the plan that fits your meeting flow.
              </h1>

              <p className="mt-4 max-w-md text-base leading-8 text-white/62">
                Start free, then upgrade when your team needs longer meetings,
                recordings, analytics, and larger participant rooms.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-telefya-gold">
                <LockKeyhole size={20} />
              </div>

              <h2 className="mt-4 font-black text-white">
                Stripe-ready checkout
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-white/50">
                Free activates instantly. Paid plans redirect to Stripe once
                your Stripe keys and price IDs are configured.
              </p>
            </div>
          </div>
        </aside>

        <section className="telefya-aurora min-h-screen overflow-y-auto px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between gap-4">
              <Link href="/" className="inline-flex lg:hidden">
                <Image
                  src="/images/telefya-logo.png"
                  alt="Telefya"
                  width={146}
                  height={44}
                  priority
                  className="h-9 w-auto"
                />
              </Link>

              <Link
                href="/login"
                className="ml-auto text-sm font-black text-telefya-blue hover:text-telefya-violet"
              >
                Sign in
              </Link>
            </div>

            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
                <Sparkles size={15} />
                Choose plan
              </span>

              <h1 className="mt-5 text-4xl font-black leading-tight text-navy-900">
                Start with Free or unlock a bigger Telefya workspace.
              </h1>

              <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-navy-500">
                Your plan controls meeting duration, participant capacity,
                recording access, analytics, and storage limits.
              </p>
            </div>

            {error ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            {loadingPlans ? (
              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-border bg-white px-5 py-6 text-sm font-black text-navy-600 shadow-soft">
                <Loader2 size={18} className="animate-spin text-telefya-blue" />
                Loading billing plans...
              </div>
            ) : (
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {sortedPlans.map((plan) => {
                  const activeFromUrl = selectedFromUrl === plan.code;
                  const popular = plan.code === "business";
                  const busy = actionPlan === plan.code;
                  const price = formatPlanPrice(plan);
                  const highlights =
                    planHighlights[plan.code as BillingPlanCode] || [];

                  return (
                    <article
                      key={plan.code}
                      className={[
                        "relative flex min-h-[520px] flex-col rounded-2xl border bg-white p-6 shadow-soft",
                        popular
                          ? "border-telefya-violet ring-2 ring-telefya-violet/15"
                          : activeFromUrl
                            ? "border-telefya-blue ring-2 ring-telefya-blue/15"
                            : "border-border",
                      ].join(" ")}
                    >
                      {popular ? (
                        <span className="absolute right-5 top-5 rounded-full bg-telefya-violet px-3 py-1 text-xs font-black text-white">
                          Popular
                        </span>
                      ) : null}

                      <div
                        className={[
                          "grid h-12 w-12 place-items-center rounded-2xl",
                          popular
                            ? "bg-telefya-violet/10 text-telefya-violet"
                            : "bg-blue-50 text-telefya-blue",
                        ].join(" ")}
                      >
                        {plan.code === "enterprise" ? (
                          <Crown size={22} />
                        ) : (
                          <Video size={22} />
                        )}
                      </div>

                      <h2 className="mt-5 text-2xl font-black text-navy-900">
                        {plan.name}
                      </h2>

                      <p className="mt-2 min-h-14 text-sm font-semibold leading-6 text-navy-500">
                        {plan.description}
                      </p>

                      <div className="mt-6 flex items-end gap-1">
                        <strong className="text-4xl font-black text-navy-900">
                          {price}
                        </strong>
                        {price !== "Custom" ? (
                          <span className="pb-1 text-xs font-bold text-navy-400">
                            /month
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-6 grid gap-3 rounded-2xl bg-navy-50 p-4 text-xs font-black text-navy-600">
                        <div className="flex justify-between gap-3">
                          <span>Meeting limit</span>
                          <strong className="text-navy-900">
                            {plan.max_meeting_minutes}m
                          </strong>
                        </div>

                        <div className="flex justify-between gap-3">
                          <span>Participants</span>
                          <strong className="text-navy-900">
                            {plan.max_participants}
                          </strong>
                        </div>

                        <div className="flex justify-between gap-3">
                          <span>Recording</span>
                          <strong className="text-navy-900">
                            {plan.recording_enabled ? "Included" : "No"}
                          </strong>
                        </div>
                      </div>

                      <ul className="mt-6 grid gap-3 text-sm font-semibold text-navy-600">
                        {highlights.map((item) => (
                          <li key={item} className="flex gap-2">
                            <Check
                              size={16}
                              className="mt-0.5 shrink-0 text-telefya-green"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => choosePlan(plan.code as BillingPlanCode)}
                        disabled={busy}
                        className={[
                          "mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-70",
                          popular
                            ? "bg-telefya-violet text-white hover:bg-telefya-purple"
                            : "border border-telefya-blue text-telefya-blue hover:bg-blue-50",
                        ].join(" ")}
                      >
                        {busy ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <ArrowRight size={17} />
                        )}
                        {busy
                          ? "Preparing..."
                          : plan.code === "free"
                            ? "Start Free"
                            : plan.code === "enterprise"
                              ? "Continue"
                              : `Choose ${plan.name}`}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}

            <p className="mt-8 text-center text-sm font-semibold text-navy-500">
              You can change plans later from your billing settings.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}