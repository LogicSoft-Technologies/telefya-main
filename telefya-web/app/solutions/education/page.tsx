import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarPlus,
  CheckCircle2,
  GraduationCap,
  Lock,
  MessageSquare,
  MonitorUp,
  Phone,
  ShieldCheck,
  UserRound,
  Video,
} from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=80",
  secondary:
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
};

const stats = [
  { value: "3x", label: "More faculty office-hour attendance online" },
  { value: "60+", label: "Students supported in a single live class" },
  { value: "99.9%", label: "Platform uptime during term-time peaks" },
  { value: "0", label: "Downloads required for students to join" },
];

const benefits = [
  {
    icon: Video,
    title: "Virtual classrooms",
    desc: "Live lectures and seminars with breakout rooms for group work, without leaving the browser.",
  },
  {
    icon: MessageSquare,
    title: "Class & cohort chat",
    desc: "Persistent chat channels per class or cohort, so questions don't get lost after the session ends.",
  },
  {
    icon: Phone,
    title: "Office hours line",
    desc: "A dedicated line for one-on-one tutoring and advising, bookable directly by students.",
  },
  {
    icon: CalendarPlus,
    title: "Term scheduling",
    desc: "Recurring class sessions, exam reviews, and advising slots managed from one calendar.",
  },
  {
    icon: MonitorUp,
    title: "Guest lectures & webinars",
    desc: "Bring outside speakers into large lecture halls or open panels with a single link.",
  },
  {
    icon: BarChart3,
    title: "Attendance & engagement",
    desc: "See who joined, how long they stayed, and where participation is dropping off.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Faculty schedules the session",
    desc: "One class link works for the whole term no new invite to send every week.",
  },
  {
    step: "02",
    title: "Students join instantly",
    desc: "No account or download required for guest access, so nobody misses the first ten minutes.",
  },
  {
    step: "03",
    title: "Recordings go to the class hub",
    desc: "Sessions are archived automatically for students who missed class or want to review.",
  },
];

const trustPoints = [
  { icon: ShieldCheck, title: "FERPA-conscious controls", desc: "Access permissions and recording consent built around student privacy requirements." },
  { icon: Lock, title: "Encrypted classrooms", desc: "Every lecture, seminar, and advising call is encrypted in transit." },
  { icon: BookOpenCheck, title: "Institution-wide rollout", desc: "SSO and bulk provisioning so IT can onboard an entire department in one pass." },
];

export default function EducationSolutionPage() {
  return (
    <main className="bg-white">
      <MarketingNavbar />

      {/* Hero */}
      <section className="telefya-aurora overflow-hidden">
        <div className="mx-auto grid max-w-[92rem] gap-10 px-5 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-green">
              <GraduationCap size={14} />
              Education
            </span>

            <h1 className="mt-5 text-[clamp(2rem,6vw,3.25rem)] font-black leading-[1.08] tracking-tight text-navy-900">
              Classrooms that work whether students are in the room or not.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-8 text-navy-500 sm:text-lg">
              Telefya gives schools, universities, and training providers a
              reliable video and messaging layer for lectures, office hours,
              and cohort collaboration built to hold up at term-start
              scale.
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
              Used by universities, K-12 districts, and independent tutoring
              and training programs.
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-border shadow-enterprise">
              <img
                src={IMAGES.hero}
                alt="Student attending an online class on a laptop"
                className="h-[320px] w-full object-cover sm:h-[420px]"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-enterprise sm:flex">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-telefya-blue">
                <Video size={18} />
              </span>
              <div>
                <p className="text-sm font-black text-navy-900">Live now</p>
                <p className="text-xs font-semibold text-navy-500">Intro to Economics — 214 joined</p>
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
              alt="Students in a classroom engaged in a lesson"
              className="h-[280px] w-full object-cover sm:h-[360px]"
              loading="lazy"
            />
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
              Why it matters
            </span>

            <h2 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Learning doesn&apos;t stop at the classroom door.
            </h2>

            <p className="mt-4 leading-7 text-navy-500">
              Students juggling jobs, commutes, or illness fall behind when
              the only way to keep up is being physically present. Faculty
              lose office-hour time to tools that crash under a hundred
              simultaneous logins during finals week. A stable, accessible
              video layer keeps every student in the room, in person or not.
            </p>

            <ul className="mt-6 grid gap-3">
              {[
                "Consistent access for commuter and remote-first students",
                "Office hours that fit around real student schedules",
                "One recorded archive instead of scattered file shares",
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
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-green shadow-soft">
              Built for campuses
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Everything a modern classroom runs on
            </h2>
            <p className="mt-4 leading-7 text-navy-500">
              One workspace for the lecture, the study group chat, the
              advising call, and the attendance data your department
              actually needs.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-white p-6 shadow-soft transition-all duration-200 hover:border-telefya-green/30 hover:shadow-enterprise"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-telefya-green">
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
            From syllabus to class session in three steps
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
            <ShieldCheck size={18} className="text-telefya-green" />
            <span className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
              Built to protect student privacy
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
          <UserRound size={28} className="mx-auto text-telefya-green" />
          <p className="mt-5 text-xl font-bold leading-9 text-navy-900 sm:text-2xl">
            &ldquo;Our biggest lecture section runs at capacity every single
            week now. Students who used to skip because they couldn&apos;t
            make it to campus just log in from wherever they are.&rdquo;
          </p>
          <p className="mt-5 text-sm font-black text-navy-500">
            Associate Dean of Digital Learning, four-year university
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-50/60 py-16 sm:py-20">
        <div className="mx-auto flex max-w-[92rem] flex-col items-start justify-between gap-6 rounded-xl border border-border bg-navy-900 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:px-14">
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Ready to bring your classes online?
            </h2>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/60">
              Talk to our team about institution-wide rollout for your
              school, university, or training program.
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