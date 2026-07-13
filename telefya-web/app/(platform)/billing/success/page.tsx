"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, CreditCard } from "lucide-react";
import { Suspense } from "react";

export default function BillingSuccessPage() {
  return (
    <Suspense>
      <BillingSuccessContent />
    </Suspense>
  );
}

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const setupRequired = searchParams.get("mode") === "setup-required";
  const sessionId = searchParams.get("session_id");

  return (
    <main className="grid min-h-[calc(100vh-68px)] place-items-center px-5">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-white p-6 text-center shadow-enterprise">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-telefya-green">
          <CheckCircle2 size={34} />
        </div>

        <h1 className="mt-6 text-3xl font-black text-navy-900">
          {setupRequired ? "Billing flow is ready" : "Billing updated"}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-7 text-navy-500">
          {setupRequired
            ? "Stripe is not configured yet, but the plan selection flow is wired. Add your Stripe keys and price IDs to activate paid checkout."
            : sessionId
              ? "Stripe is confirming your subscription. Your plan will update once the payment confirmation is received."
              : `Your ${plan || "selected"} plan is ready.`}
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link
            href="/lobby"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white hover:bg-telefya-violet"
          >
            Open workspace
            <ArrowRight size={17} />
          </Link>

          <Link
            href="/billing"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-black text-navy-800 hover:border-telefya-blue hover:text-telefya-blue"
          >
            <CreditCard size={17} />
            View billing
          </Link>
        </div>
      </section>
    </main>
  );
}