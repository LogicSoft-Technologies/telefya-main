import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarPlus,
  CheckCircle2,
  FileCheck2,
  Gavel,
  Landmark,
  Lock,
  MessageSquare,
  MonitorUp,
  Phone,
  ServerCog,
  UserRound,
  Video,
} from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=80",
  secondary:
    "https://images.unsplash.com/photo-1555848962-6e79363ec58f?auto=format&fit=crop&w=1200&q=80",
};

const stats = [
  { value: "100%", label: "Sessions encrypted in transit" },
  { value: "30+", label: "Agencies and public bodies supported" },
  { value: "<1s", label: "Median time to join a public hearing" },
  { value: "24/7", label: "Availability for emergency coordination" },
];

const benefits = [
  {
    icon: Video,
    title: "Public hearings & meetings",
    desc: "Livestream council sessions and hearings with moderated public comment, accessible without an app.",
  },
  {
    icon: MessageSquare,
    title: "Interagency chat",
    desc: "Secure channels between departments and agencies that keep records within your retention policy.",
  },
  {
    icon: Phone,
    title: "Constituent service lines",
    desc: "Route citizen calls to the right department without adding call-center infrastructure.",
  },
  {
    icon: CalendarPlus,
    title: "Case & appointment scheduling",
    desc: "Book constituent appointments and case reviews directly against staff calendars.",
  },
  {
    icon: MonitorUp,
    title: "Emergency briefings",
    desc: "Stand up a coordination room in minutes when departments need to align fast.",
  },
  {
    icon: BarChart3,
    title: "Participation reporting",
    desc: "Track hearing attendance and public engagement for compliance and transparency reporting.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Session is scheduled and published",
    desc: "Hearings and public meetings go on the calendar with a public join link, no account required.",
  },
  {
    step: "02",
    title: "Public and staff join securely",
    desc: "Attendees join through a controlled room with moderated comment, keeping the record clean.",
  },
  {
    step: "03",
    title: "Recording enters the public record",
    desc: "Sessions are archived automatically, meeting retention and disclosure requirements.",
  },
];

const trustPoints = [
  { icon: ServerCog, title: "Deployment flexibility", desc: "Dedicated or region-restricted infrastructure to meet data residency requirements." },
  { icon: Lock, title: "Encrypted by default", desc: "Every hearing, briefing, and interagency call is encrypted in transit." },
  { icon: FileCheck2, title: "Audit-ready records", desc: "Session logs and recordings retained in line with public records requirements." },
];

export default function GovernmentSolutionPage() {
  return (
    <main className="bg-white">
      <MarketingNavbar />

      {/* Hero */}
      <section className="telefya-aurora overflow-hidden">
        <div className="mx-auto grid max-w-[92rem] gap-10 px-5 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
              <Landmark size={14} />
              Government
            </span>

            <h1 className="mt-5 text-[clamp(2rem,6vw,3.25rem)] font-black leading-[1.08] tracking-tight text-navy-900">
              Public communication that meets the public where they are.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-8 text-navy-500 sm:text-lg">
              Telefya gives agencies and public bodies a secure, compliant
              way to run hearings, interagency coordination, and constituent
              services built for accountability, not just convenience.
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
              Used by municipal governments, public agencies, and civic
              organizations for public-facing and internal communication.
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-border shadow-enterprise">
              <img
                src={IMAGES.hero}
                alt="Government building representing public institutions"
                className="h-[320px] w-full object-cover sm:h-[420px]"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-enterprise sm:flex">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-telefya-blue">
                <Gavel size={18} />
              </span>
              <div>
                <p className="text-sm font-black text-navy-900">Public hearing</p>
                <p className="text-xs font-semibold text-navy-500">Recorded for the record</p>
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
              alt="Civic building used for public meetings"
              className="h-[280px] w-full object-cover sm:h-[360px]"
              loading="lazy"
            />
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
              Why it matters
            </span>

            <h2 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Access to public process is a public obligation.
            </h2>

            <p className="mt-4 leading-7 text-navy-500">
              Residents who can't attend a hearing in person shouldn't lose
              their voice in it. Agencies coordinating a response can't
              afford a tool that drops calls or leaves no record. A
              dependable, compliant video and messaging layer keeps public
              process open and keeps departments aligned when it matters.
            </p>

            <ul className="mt-6 grid gap-3">
              {[
                "Wider public participation in hearings and comment periods",
                "Faster interagency coordination during time-sensitive events",
                "A clean, retained record for every public session",
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
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue shadow-soft">
              Built for public bodies
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Everything a public agency runs on
            </h2>
            <p className="mt-4 leading-7 text-navy-500">
              One workspace for the public hearing, the interagency channel,
              the constituent call, and the record you're required to keep.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-white p-6 shadow-soft transition-all duration-200 hover:border-telefya-blue/30 hover:shadow-enterprise"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-telefya-blue">
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
            From agenda to public record in three steps
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
              Built for compliance and accountability
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
          <UserRound size={28} className="mx-auto text-telefya-blue" />
          <p className="mt-5 text-xl font-bold leading-9 text-navy-900 sm:text-2xl">
            &ldquo;Public comment turnout at our hearings roughly doubled
            once residents could join from home. The recorded archive has
            also made our disclosure requests far easier to fulfill.&rdquo;
          </p>
          <p className="mt-5 text-sm font-black text-navy-500">
            Clerk of Council, municipal government office
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-50/60 py-16 sm:py-20">
        <div className="mx-auto flex max-w-[92rem] flex-col items-start justify-between gap-6 rounded-xl border border-border bg-navy-900 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:px-14">
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Ready to open up your public process?
            </h2>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/60">
              Talk to our team about compliant deployment for your agency or
              public body.
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