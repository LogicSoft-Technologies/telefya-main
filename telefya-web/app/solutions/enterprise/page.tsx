import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarPlus,
  CheckCircle2,
  Fingerprint,
  Globe2,
  KeyRound,
  Lock,
  MessageSquare,
  MonitorUp,
  Phone,
  UserRound,
  Video,
} from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80",
  secondary:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
};

const stats = [
  { value: "10,000+", label: "Seats supported per workspace" },
  { value: "99.95%", label: "Uptime SLA on Enterprise plans" },
  { value: "<150ms", label: "Median regional call latency" },
  { value: "1", label: "Named solutions engineer per account" },
];

const benefits = [
  {
    icon: Video,
    title: "All-hands & town halls",
    desc: "Broadcast to thousands with low-latency streaming and moderated Q&A, without a third-party webinar tool.",
  },
  {
    icon: MessageSquare,
    title: "Team & department chat",
    desc: "Persistent channels that live alongside meetings, so context never gets lost between the two.",
  },
  {
    icon: Phone,
    title: "Client & vendor calls",
    desc: "Professional voice workflows for external calls, routed through the same workspace as internal meetings.",
  },
  {
    icon: CalendarPlus,
    title: "Cross-team scheduling",
    desc: "Book across departments, time zones, and calendars without the usual back-and-forth.",
  },
  {
    icon: MonitorUp,
    title: "Executive briefings",
    desc: "Host leadership reviews and board updates with recording, transcripts, and controlled access.",
  },
  {
    icon: BarChart3,
    title: "Org-wide analytics",
    desc: "Usage, adoption, and meeting-load reporting rolled up by department or region.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Provision with SSO",
    desc: "Roll out to the entire org through your identity provider — no manual account creation.",
  },
  {
    step: "02",
    title: "Set governance policies",
    desc: "Configure retention, recording, and access rules once, applied consistently across every team.",
  },
  {
    step: "03",
    title: "Scale without re-platforming",
    desc: "Add seats, regions, and integrations as you grow, on the same workspace you started with.",
  },
];

const trustPoints = [
  { icon: Fingerprint, title: "SSO & SCIM", desc: "Single sign-on and automated provisioning through your existing identity provider." },
  { icon: KeyRound, title: "Granular access controls", desc: "Role-based permissions down to the meeting, recording, and channel level." },
  { icon: Globe2, title: "Regional deployment", desc: "Route traffic through the regions your compliance and latency requirements demand." },
];

export default function EnterpriseSolutionPage() {
  return (
    <main className="bg-white">
      <MarketingNavbar />

      {/* Hero */}
      <section className="telefya-aurora overflow-hidden">
        <div className="mx-auto grid max-w-[92rem] gap-10 px-5 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-gold">
              <Building2 size={14} />
              Enterprise
            </span>

            <h1 className="mt-5 text-[clamp(2rem,6vw,3.25rem)] font-black leading-[1.08] tracking-tight text-navy-900">
              Communication infrastructure built for scale.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-8 text-navy-500 sm:text-lg">
              Telefya gives large organizations one governed platform for
              meetings, chat, and live events replacing the patchwork of
              tools most enterprises accumulate one department at a time.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact-sales"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-telefya-blue px-6 text-sm font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet hover:shadow-enterprise"
              >
                Talk to sales
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-white px-6 text-sm font-black text-navy-900 transition-all duration-200 hover:border-telefya-blue hover:text-telefya-blue"
              >
                Start free
              </Link>
            </div>

            <p className="mt-6 text-xs font-semibold text-navy-400">
              Used by finance, technology, and professional services
              organizations running meetings at global scale.
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-border shadow-enterprise">
              <img
                src={IMAGES.hero}
                alt="Enterprise team collaborating around a table"
                className="h-[320px] w-full object-cover sm:h-[420px]"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-enterprise sm:flex">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-telefya-gold">
                <Fingerprint size={18} />
              </span>
              <div>
                <p className="text-sm font-black text-navy-900">SSO enabled</p>
                <p className="text-xs font-semibold text-navy-500">Provisioned org-wide</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-navy-900">
        <div className="mx-auto grid max-w-[92rem] grid-cols-2 gap-6 px-5 py-10 sm:grid-cols-4 lg:px-8">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-black text-white sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-white/55 sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why it matters */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto grid max-w-[92rem] gap-10 px-5 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
          <div className="order-2 overflow-hidden rounded-xl border border-border shadow-soft lg:order-1">
            <img
              src={IMAGES.secondary}
              alt="Business professionals in a strategic planning meeting"
              className="h-[280px] w-full object-cover sm:h-[360px]"
              loading="lazy"
            />
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
              Why it matters
            </span>

            <h2 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Every extra tool is another gap in governance.
            </h2>

            <p className="mt-4 leading-7 text-navy-500">
              Large organizations end up running meetings on one tool, chat
              on another, and webinars on a third each with its own
              access model and none of them talking to IT's identity
              provider. That fragmentation is where data leaves controlled
              boundaries. One governed platform closes that surface without
              slowing teams down.
            </p>

            <ul className="mt-6 grid gap-3">
              {[
                "One identity and access model across every meeting surface",
                "Consistent retention and recording policy, enforced by default",
                "A single vendor relationship instead of five renewal cycles",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-telefya-green" />
                  <span className="text-sm font-semibold leading-6 text-navy-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="bg-navy-50/60 py-16 sm:py-24">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-gold shadow-soft">
              Built for large orgs
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Everything a growing org runs on
            </h2>
            <p className="mt-4 leading-7 text-navy-500">
              One workspace for the all-hands, the department channel, the
              client call, and the adoption numbers leadership actually
              looks at.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-white p-6 shadow-soft transition-all duration-200 hover:border-telefya-gold/40 hover:shadow-enterprise"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-telefya-gold">
                  <item.icon size={20} />
                </span>
                <h3 className="mt-4 font-black text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
            How it works
          </span>
          <h2 className="mt-5 max-w-lg text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
            From procurement to org-wide rollout
          </h2>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {workflow.map((item) => (
              <div key={item.step} className="rounded-xl border border-border bg-white p-6 shadow-soft">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy-50 text-sm font-black text-navy-400">
                  {item.step}
                </span>
                <h3 className="mt-4 font-black text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-navy-900 py-16 sm:py-20">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-telefya-green" />
            <span className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
              Built for IT and security teams
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {trustPoints.map((point) => (
              <div key={point.title} className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-telefya-blue">
                  <point.icon size={18} className="text-white" />
                </span>
                <p className="mt-4 font-black text-white">{point.title}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-white/55">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
          <UserRound size={28} className="mx-auto text-telefya-gold" />
          <p className="mt-5 text-xl font-bold leading-9 text-navy-900 sm:text-2xl">
            &ldquo;We consolidated four separate meeting and webinar tools
            into one workspace. IT finally has a single place to manage
            access instead of chasing licenses across five vendors.&rdquo;
          </p>
          <p className="mt-5 text-sm font-black text-navy-500">
            VP of IT Infrastructure, global professional services firm
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-50/60 py-16 sm:py-20">
        <div className="mx-auto flex max-w-[92rem] flex-col items-start justify-between gap-6 rounded-xl border border-border bg-navy-900 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:px-14">
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Ready to consolidate your meeting stack?
            </h2>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/60">
              Talk to our team about SSO, governance, and org-wide rollout
              for your organization.
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