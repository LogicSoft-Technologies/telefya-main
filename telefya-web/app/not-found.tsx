import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  Search,
} from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f8faff] px-5 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_18%,rgba(15,107,255,0.16),transparent_27%),radial-gradient(circle_at_87%_12%,rgba(100,38,255,0.15),transparent_30%),radial-gradient(circle_at_76%_86%,rgba(34,211,134,0.1),transparent_25%)]" />

      <section className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-white/80 bg-white/90 p-7 text-center shadow-enterprise backdrop-blur-xl sm:p-10">
        <div className="absolute inset-x-0 top-0 h-1 telefya-accent-line" />

        <Image
          src="/images/telefya-logo.png"
          alt="Telefya"
          width={132}
          height={40}
          className="mx-auto h-10 w-auto object-contain"
          priority
        />

        <div className="mx-auto mt-9 grid h-20 w-20 place-items-center rounded-[24px] bg-gradient-to-br from-blue-50 via-violet-50 to-purple-50 text-telefya-blue">
          <Search size={34} strokeWidth={2.3} />
        </div>

        <div className="mt-7">
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black tracking-[0.18em] text-telefya-blue">
            ERROR 404
          </span>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
            This page isn’t available.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-navy-500 sm:text-base">
            The link may be incorrect, expired, or the page may have moved.
          </p>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-telefya-violet hover:shadow-violet-500/25"
          >
            <Home size={18} />
            Go to homepage
          </Link>

          <Link
            href="/lobby"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-black text-navy-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
          >
            <ArrowLeft size={18} />
            Return to lobby
          </Link>
        </div>
      </section>
    </main>
  );
}