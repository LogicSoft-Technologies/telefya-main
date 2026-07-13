"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, XCircle } from "lucide-react";

export default function BillingCancelPage() {
  return (
    <main className="grid min-h-[calc(100vh-68px)] place-items-center px-5">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-white p-6 text-center shadow-enterprise">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600">
          <XCircle size={34} />
        </div>

        <h1 className="mt-6 text-3xl font-black text-navy-900">
          Checkout cancelled
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-7 text-navy-500">
          No changes were made to your plan. You can continue with your current
          workspace access or choose another plan.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link
            href="/choose-plan"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white hover:bg-telefya-violet"
          >
            Choose plan
            <ArrowRight size={17} />
          </Link>

          <Link
            href="/billing"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-black text-navy-800 hover:border-telefya-blue hover:text-telefya-blue"
          >
            <CreditCard size={17} />
            Back to billing
          </Link>
        </div>
      </section>
    </main>
  );
}