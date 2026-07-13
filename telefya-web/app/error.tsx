"use client";

import { RefreshCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-navy-50 px-5">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 text-center shadow-enterprise">
        <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600">
          Something went wrong
        </span>

        <h1 className="mt-5 text-3xl font-black text-navy-900">
          Telefya could not load this view.
        </h1>

        <p className="mt-3 leading-7 text-navy-500">
          {error.message || "Please try again. If it continues, contact support."}
        </p>

        <button
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-telefya-blue px-5 py-3 font-black text-white hover:bg-telefya-violet"
        >
          <RefreshCcw size={18} />
          Try again
        </button>
      </section>
    </main>
  );
}