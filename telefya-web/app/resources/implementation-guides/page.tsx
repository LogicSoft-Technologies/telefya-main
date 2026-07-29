import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Fingerprint,
  Smartphone,
  Sliders,
  Workflow,
} from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";

const guides = [
  {
    icon: Workflow,
    title: "Quick Start Guide",
    desc: "Provision your workspace, invite your first users, and configure default settings.",
    length: "15 min read",
  },
  {
    icon: Fingerprint,
    title: "SSO & Identity Setup",
    desc: "Connect your identity provider and configure SCIM-based provisioning.",
    length: "20 min read",
  },
  {
    icon: Sliders,
    title: "Meeting Configuration",
    desc: "Set organization-wide defaults for recording, layout, and participant policy.",
    length: "12 min read",
  },
  {
    icon: Smartphone,
    title: "Mobile Rollout",
    desc: "Deploy the Telefya mobile app across your organization with managed configuration.",
    length: "10 min read",
  },
  {
    icon: Building2,
    title: "Migrating from Another Platform",
    desc: "Move existing meeting schedules, contacts, and recordings into Telefya.",
    length: "25 min read",
  },
  {
    icon: BookOpen,
    title: "Multi-Department Rollout",
    desc: "Sequence a phased rollout across departments with minimal disruption.",
    length: "18 min read",
  },
];

const timeline = [
  {
    phase: "Week 1",
    title: "Provisioning & configuration",
    desc: "Connect identity provider, configure workspace defaults, and onboard an initial pilot group.",
  },
  {
    phase: "Weeks 2–3",
    title: "Pilot & feedback",
    desc: "Run day-to-day operations with the pilot group and collect structured feedback before wider rollout.",
  },
  {
    phase: "Week 4+",
    title: "Organization-wide rollout",
    desc: "Extend access department by department, with support from your assigned solutions engineer.",
  },
];

export default function ImplementationGuidesPage() {
  return (
    <main className="bg-white">
      <MarketingNavbar />

      {/* Hero */}
      <section className="telefya-aurora overflow-hidden">
        <div className="mx-auto max-w-[92rem] px-5 py-14 sm:py-20 lg:px-8 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-gold">
            <BookOpen size={14} />
            Implementation Guides
          </span>

          <h1 className="mt-5 max-w-2xl text-[clamp(2rem,6vw,3.25rem)] font-black leading-[1.08] tracking-tight text-navy-900">
            Structured guidance for a predictable rollout.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-navy-500 sm:text-lg">
            Step-by-step documentation for provisioning, configuration, and
            organization-wide deployment of Telefya.
          </p>
        </div>
      </section>

      {/* Guides grid */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((item) => (
              <Link
                key={item.title}
                href="#"
                className="group rounded-xl border border-border bg-white p-6 shadow-soft transition-all duration-200 hover:border-telefya-gold/40 hover:shadow-enterprise"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-telefya-gold">
                  <item.icon size={20} />
                </span>
                <h3 className="mt-4 font-black text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
                  {item.desc}
                </p>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-navy-300">
                  {item.length}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-navy-50/60 py-16 sm:py-24">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue shadow-soft">
            Typical rollout timeline
          </span>
          <h2 className="mt-5 max-w-lg text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
            From provisioning to full deployment
          </h2>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {timeline.map((item) => (
              <div key={item.phase} className="rounded-xl border border-border bg-white p-6 shadow-soft">
                <span className="inline-flex rounded-lg bg-navy-50 px-3 py-1.5 text-xs font-black text-navy-500">
                  {item.phase}
                </span>
                <h3 className="mt-4 font-black text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-white p-5 shadow-soft">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-telefya-green" />
            <p className="text-sm font-semibold leading-6 text-navy-600">
              Enterprise customers are assigned a dedicated solutions
              engineer for the duration of implementation, from initial
              configuration through full organizational rollout.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto flex max-w-[92rem] flex-col items-start justify-between gap-6 rounded-xl border border-border bg-navy-900 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:px-14">
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Planning a rollout across your organization?
            </h2>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/60">
              Talk to our team about a guided implementation plan for your
              organization.
            </p>
          </div>
          <Link
            href="/contact-sales"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-telefya-blue px-6 text-sm font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet"
          >
            Talk to sales
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}