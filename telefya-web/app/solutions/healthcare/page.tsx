import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  FileLock2,
  HeartPulse,
  Lock,
  MessageSquare,
  MonitorUp,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Video,
} from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1400&q=80",
  secondary:
    "https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&w=1200&q=80",
};

const stats = [
  { value: "40%", label: "Fewer missed appointments with virtual visits" },
  { value: "<2min", label: "Average time to join a scheduled consultation" },
  { value: "100%", label: "Encrypted sessions, end to end" },
  { value: "24/7", label: "Availability for on-call and urgent consults" },
];

const benefits = [
  {
    icon: Video,
    title: "Telehealth visits",
    desc: "HD, low-latency video consultations that hold up on hospital wifi and patient mobile data alike.",
  },
  {
    icon: MessageSquare,
    title: "Care team chat",
    desc: "Secure messaging between physicians, nurses, and specialists without leaving the platform.",
  },
  {
    icon: Phone,
    title: "Nurse line & triage",
    desc: "Route incoming calls to the right department with voice workflows built for clinical intake.",
  },
  {
    icon: CalendarPlus,
    title: "Appointment scheduling",
    desc: "Patients book, reschedule, and get reminded automatically, cutting no-shows across your calendar.",
  },
  {
    icon: MonitorUp,
    title: "Group education sessions",
    desc: "Run live prenatal classes, support groups, or post-op education for many patients at once.",
  },
  {
    icon: BarChart3,
    title: "Utilization analytics",
    desc: "See visit volume, wait times, and provider load to plan staffing and reduce bottlenecks.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Patient books a visit",
    desc: "Self-service scheduling syncs to your provider calendars, with automatic confirmation and reminders.",
  },
  {
    step: "02",
    title: "Secure room opens on time",
    desc: "A private, encrypted room is generated per appointment — no downloads, no waiting rooms that leak data.",
  },
  {
    step: "03",
    title: "Visit notes stay attached",
    desc: "Session recordings and chat logs (where consented) stay tied to the encounter for continuity of care.",
  },
];

const trustPoints = [
  { icon: FileLock2, title: "HIPAA-ready architecture", desc: "Encrypted media, access controls, and audit trails built for protected health information." },
  { icon: Lock, title: "End-to-end encryption", desc: "Video, audio, and chat are encrypted in transit across every session." },
  { icon: ClipboardCheck, title: "Consent & recording controls", desc: "Explicit consent prompts before any recording starts, with granular retention settings." },
];

export default function HealthcareSolutionPage() {
  return (
    <main className="bg-white">
      <MarketingNavbar />

      {/* Hero */}
      <section className="telefya-aurora overflow-hidden">
        <div className="mx-auto grid max-w-[92rem] gap-10 px-5 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-purple">
              <HeartPulse size={14} />
              Healthcare
            </span>

            <h1 className="mt-5 text-[clamp(2rem,6vw,3.25rem)] font-black leading-[1.08] tracking-tight text-navy-900">
              Care that reaches patients wherever they are.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-8 text-navy-500 sm:text-lg">
              Telefya gives clinics, hospitals, and telehealth teams a secure
              video and communication layer built for real clinical
              workflows not a generic meeting app repurposed for medicine.
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
              Used by outpatient clinics, telehealth providers, and hospital
              care teams for daily patient communication.
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-border shadow-enterprise">
              <img
                src={IMAGES.hero}
                alt="Clinician reviewing a virtual consultation on a tablet"
                className="h-[320px] w-full object-cover sm:h-[420px]"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-enterprise sm:flex">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-telefya-green">
                <ShieldCheck size={18} />
              </span>
              <div>
                <p className="text-sm font-black text-navy-900">HIPAA-ready</p>
                <p className="text-xs font-semibold text-navy-500">Encrypted by default</p>
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
              alt="Doctor speaking with a patient during a virtual appointment"
              className="h-[280px] w-full object-cover sm:h-[360px]"
              loading="lazy"
            />
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
              Why it matters
            </span>

            <h2 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Access shouldn&apos;t depend on a waiting room.
            </h2>

            <p className="mt-4 leading-7 text-navy-500">
              Patients skip follow-ups when getting to a clinic means taking
              a day off work or arranging transport. Providers lose hours to
              scheduling friction and dropped calls on unreliable video
              tools. A dependable, secure video layer closes that gap
              keeping chronic-care patients engaged, cutting no-shows, and
              letting specialists see more patients without adding rooms.
            </p>

            <ul className="mt-6 grid gap-3">
              {[
                "Lower no-show rates for follow-up and chronic-care visits",
                "Specialist access for patients outside major cities",
                "Faster triage without adding phone-line headcount",
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
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-purple shadow-soft">
              Built for care teams
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Everything a modern care team runs on
            </h2>
            <p className="mt-4 leading-7 text-navy-500">
              One workspace for the visit, the follow-up message, the
              on-call line, and the numbers that tell you where care is
              breaking down.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-white p-6 shadow-soft transition-all duration-200 hover:border-telefya-purple/30 hover:shadow-enterprise"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-purple-50 text-telefya-purple">
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
            From booking to visit in three steps
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
            <Stethoscope size={18} className="text-telefya-green" />
            <span className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
              Built to protect patient data
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
          <UserRound size={28} className="mx-auto text-telefya-purple" />
          <p className="mt-5 text-xl font-bold leading-9 text-navy-900 sm:text-2xl">
            &ldquo;Moving our follow-up visits onto Telefya cut our no-show
            rate more than any reminder system we tried. Patients actually
            show up when showing up just means opening a link.&rdquo;
          </p>
          <p className="mt-5 text-sm font-black text-navy-500">
            Director of Telehealth Operations, outpatient clinic network
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-50/60 py-16 sm:py-20">
        <div className="mx-auto flex max-w-[92rem] flex-col items-start justify-between gap-6 rounded-xl border border-border bg-navy-900 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:px-14">
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Ready to bring care visits online?
            </h2>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/60">
              Talk to our team about HIPAA-ready deployment for your clinic
              or health system.
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