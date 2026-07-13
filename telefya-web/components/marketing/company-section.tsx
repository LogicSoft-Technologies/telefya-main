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
    <section id="company" className="relative overflow-hidden bg-white py-20">
      <div className="absolute right-0 top-16 h-80 w-80 rounded-full bg-telefya-violet/10 blur-3xl" />
      <div className="absolute bottom-8 left-0 h-72 w-72 rounded-full bg-telefya-blue/10 blur-3xl" />

      <div className="relative mx-auto max-w-[92rem] px-5 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-telefya-violet">
              Company
            </span>

            <h2 className="mt-5 max-w-xl text-4xl font-black leading-tight text-navy-900">
              Telefya is building the communication layer for modern digital work.
            </h2>

            <p className="mt-5 max-w-xl leading-8 text-navy-500">
              We help organizations run meetings, live events, webinars, and
              branded collaboration experiences without making the tools feel
              heavy or complicated.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/contact-sales"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-telefya-blue px-6 py-4 font-black text-white shadow-soft hover:bg-telefya-violet"
              >
                Contact sales <ArrowRight size={18} />
              </Link>

              <Link
                href="#resources"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-6 py-4 font-black text-navy-900 shadow-soft hover:border-telefya-blue hover:text-telefya-blue"
              >
                View resources
              </Link>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-1">
            {values.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-border bg-white p-6 shadow-soft"
              >
                <div className="flex gap-5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl telefya-gradient text-white">
                    <item.icon size={24} />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-navy-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 leading-7 text-navy-500">{item.desc}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-5 rounded-2xl border border-border bg-navy-900 p-6 text-white shadow-enterprise md:grid-cols-3">
          <div>
            <Globe2 size={26} className="text-telefya-blue" />
            <strong className="mt-4 block text-3xl font-black">Global</strong>
            <span className="mt-2 block text-sm font-semibold text-white/60">
              Built for remote teams and distributed events.
            </span>
          </div>

          <div>
            <Users size={26} className="text-telefya-green" />
            <strong className="mt-4 block text-3xl font-black">Teams</strong>
            <span className="mt-2 block text-sm font-semibold text-white/60">
              Designed for hosts, speakers, attendees, and admins.
            </span>
          </div>

          <div>
            <Sparkles size={26} className="text-telefya-gold" />
            <strong className="mt-4 block text-3xl font-black">Modern</strong>
            <span className="mt-2 block text-sm font-semibold text-white/60">
              Enterprise-grade controls with a clean user experience.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}