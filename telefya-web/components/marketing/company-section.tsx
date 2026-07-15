import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Globe2,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const values = [
  {
    title: "Built for trust",
    desc: "Secure collaboration for teams, customers, communities, and organizations.",
    icon: ShieldCheck,
  },
  {
    title: "Designed for scale",
    desc: "From small meetings to high-attendance conferences and platform integrations.",
    icon: Building2,
  },
  {
    title: "Human connection",
    desc: "Simple tools that make online events feel clear, useful, and professional.",
    icon: HeartHandshake,
  },
];

export function CompanySection() {
  return (
    <section
      id="company"
      className="relative overflow-hidden bg-white py-14 sm:py-20"
    >
      <div className="absolute right-0 top-16 h-56 w-56 rounded-full bg-telefya-violet/10 blur-3xl sm:h-80 sm:w-80" />
      <div className="absolute bottom-8 left-0 h-52 w-52 rounded-full bg-telefya-blue/10 blur-3xl sm:h-72 sm:w-72" />

      <div className="relative mx-auto max-w-[92rem] px-5 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-telefya-violet">
              Company
            </span>

            <h2 className="mt-5 max-w-xl text-[clamp(2rem,8vw,2.5rem)] font-black leading-tight text-navy-900">
              Telefya is building the communication layer for modern digital
              work.
            </h2>

            <p className="mt-5 max-w-xl leading-8 text-navy-500">
              We help organizations run meetings, live events, webinars, and
              branded collaboration experiences without making the tools feel
              heavy or complicated.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/contact-sales"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-6 py-4 font-black text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-telefya-violet hover:shadow-enterprise"
              >
                Contact sales <ArrowRight size={18} />
              </Link>

              <Link
                href="#resources"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-white px-6 py-4 font-black text-navy-900 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-telefya-blue hover:text-telefya-blue"
              >
                View resources
              </Link>
            </div>
          </div>

          <div className="telefya-horizontal-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0 lg:grid-cols-1 lg:gap-5">
            {values.map((item) => (
              <article
                key={item.title}
                className="min-w-[84vw] snap-start rounded-2xl border border-border bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-enterprise sm:min-w-[360px] sm:p-6 md:min-w-0"
              >
                <div className="flex gap-4 sm:gap-5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl telefya-gradient text-white transition-transform duration-300 hover:scale-110">
                    <item.icon size={24} />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-navy-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 leading-7 text-navy-500">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="telefya-horizontal-scroll mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl border border-border bg-navy-900 p-4 text-white shadow-enterprise sm:mt-14 sm:p-6 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible">
          <div className="min-w-[76vw] snap-start rounded-xl bg-white/[0.04] p-4 md:min-w-0 md:bg-transparent md:p-0">
            <Globe2 size={26} className="text-telefya-blue" />
            <strong className="mt-4 block text-3xl font-black">Global</strong>
            <span className="mt-2 block text-sm font-semibold text-white/60">
              Built for remote teams and distributed events.
            </span>
          </div>

          <div className="min-w-[76vw] snap-start rounded-xl bg-white/[0.04] p-4 md:min-w-0 md:bg-transparent md:p-0">
            <Users size={26} className="text-telefya-green" />
            <strong className="mt-4 block text-3xl font-black">Teams</strong>
            <span className="mt-2 block text-sm font-semibold text-white/60">
              Designed for hosts, speakers, attendees, and admins.
            </span>
          </div>

          <div className="min-w-[76vw] snap-start rounded-xl bg-white/[0.04] p-4 md:min-w-0 md:bg-transparent md:p-0">
            <Sparkles size={26} className="text-telefya-gold" />
            <strong className="mt-4 block text-3xl font-black">Modern</strong>
            <span className="mt-2 block text-sm font-semibold text-white/60">
              Enterprise-grade controls with a clean user experience.
            </span>
          </div>
        </div>

        <p className="mt-2 text-xs font-semibold text-navy-400 md:hidden">
          Swipe through the highlights
        </p>
      </div>
    </section>
  );
}