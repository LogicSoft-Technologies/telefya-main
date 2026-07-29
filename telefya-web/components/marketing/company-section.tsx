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
    desc: "Secure collaboration infrastructure for teams, customers, communities, and organizations.",
    icon: ShieldCheck,
  },
  {
    title: "Designed for scale",
    desc: "From small internal meetings to high-attendance events and platform-level integrations.",
    icon: Building2,
  },
  {
    title: "Built for people",
    desc: "Enterprise-grade controls delivered through an experience your teams will actually use.",
    icon: HeartHandshake,
  },
];

const highlights = [
  {
    icon: Globe2,
    stat: "Global",
    desc: "Infrastructure built for distributed teams and cross-region events.",
  },
  {
    icon: Users,
    stat: "Role-based",
    desc: "Purpose-built experiences for hosts, speakers, attendees, and administrators.",
  },
  {
    icon: Sparkles,
    stat: "Enterprise-ready",
    desc: "Governance and access controls without added operational overhead.",
  },
];

export function CompanySection() {
  return (
    <section id="company" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-violet">
              Company
            </span>

            <h2 className="mt-5 max-w-xl text-[clamp(2rem,6vw,2.75rem)] font-black leading-[1.1] tracking-tight text-navy-900">
              The communication layer for modern digital work.
            </h2>

            <p className="mt-5 max-w-xl leading-8 text-navy-500">
              Telefya provides the infrastructure organizations rely on to
              run meetings, live events, webinars, and branded collaboration
              experiences — without adding operational complexity for the
              teams that manage them.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact-sales"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-6 text-sm font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet hover:shadow-enterprise"
              >
                Contact sales
                <ArrowRight size={16} />
              </Link>

              <Link
                href="#resources"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-white px-6 text-sm font-black text-navy-900 transition-all duration-200 hover:border-telefya-blue hover:text-telefya-blue"
              >
                View resources
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {values.map((item) => (
              <article
                key={item.title}
                className="flex gap-4 rounded-xl border border-border bg-white p-5 shadow-soft transition-all duration-200 hover:border-telefya-blue/30 hover:shadow-enterprise sm:gap-5 sm:p-6"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl telefya-gradient text-white">
                  <item.icon size={22} />
                </span>

                <div>
                  <h3 className="font-black text-navy-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm font-semibold leading-6 text-navy-500">
                    {item.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-4 rounded-xl border border-white/10 bg-navy-900 p-6 shadow-enterprise sm:mt-16 sm:grid-cols-3 sm:p-8">
          {highlights.map((item) => (
            <div key={item.stat} className="border-white/10 sm:border-l sm:pl-6 first:sm:border-l-0 first:sm:pl-0">
              <item.icon size={22} className="text-telefya-blue" />
              <p className="mt-4 text-2xl font-black text-white">{item.stat}</p>
              <p className="mt-1.5 text-sm font-semibold leading-6 text-white/55">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}