import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarPlus,
  MonitorUp,
  Play,
  Settings,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";

const featured = {
  title: "Getting started with Telefya in under 10 minutes",
  desc: "A complete walkthrough of creating your workspace, scheduling your first meeting, and inviting your team.",
  duration: "9:42",
  category: "Getting Started",
};

const tutorials = [
  {
    icon: Video,
    title: "Hosting your first meeting",
    desc: "Room setup, host controls, and inviting participants.",
    duration: "6:15",
    category: "Meetings",
  },
  {
    icon: Users,
    title: "Managing workspace members",
    desc: "Adding teammates, assigning roles, and setting permissions.",
    duration: "5:03",
    category: "Administration",
  },
  {
    icon: CalendarPlus,
    title: "Scheduling recurring sessions",
    desc: "Set up weekly meetings and sync with your calendar.",
    duration: "4:28",
    category: "Scheduling",
  },
  {
    icon: MonitorUp,
    title: "Running a live event",
    desc: "Configure Live Stage for webinars and large audiences.",
    duration: "8:57",
    category: "Live Events",
  },
  {
    icon: ShieldCheck,
    title: "Configuring SSO and access control",
    desc: "Connect your identity provider and set permission policy.",
    duration: "7:34",
    category: "Security",
  },
  {
    icon: BarChart3,
    title: "Reading your analytics dashboard",
    desc: "Understand usage, attendance, and engagement reporting.",
    duration: "5:49",
    category: "Analytics",
  },
  {
    icon: Settings,
    title: "Customizing meeting defaults",
    desc: "Set organization-wide defaults for recording and layout.",
    duration: "3:56",
    category: "Administration",
  },
];

function Thumbnail({ accent = "bg-telefya-blue" }: { accent?: string }) {
  return (
    <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-navy-900">
      <div className="telefya-accent-line absolute inset-x-0 top-0 h-1" />
      <span className={`grid h-12 w-12 place-items-center rounded-full ${accent} text-white shadow-enterprise`}>
        <Play size={18} className="translate-x-0.5" />
      </span>
    </div>
  );
}

export default function VideoTutorialsPage() {
  return (
    <main className="bg-white">
      <MarketingNavbar />

      {/* Hero */}
      <section className="telefya-aurora overflow-hidden">
        <div className="mx-auto max-w-[92rem] px-5 py-14 sm:py-20 lg:px-8 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-purple">
            <Video size={14} />
            Video Tutorials
          </span>

          <h1 className="mt-5 max-w-2xl text-[clamp(2rem,6vw,3.25rem)] font-black leading-[1.08] tracking-tight text-navy-900">
            Product walkthroughs for every part of Telefya.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-navy-500 sm:text-lg">
            Short, focused videos covering setup, day-to-day usage, and
            administration for hosts and workspace administrators.
          </p>
        </div>
      </section>

      {/* Featured */}
      <section className="bg-white pb-16 sm:pb-24">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <Link
            href="#"
            className="group grid gap-6 rounded-xl border border-border bg-white p-5 shadow-soft transition-all duration-200 hover:border-telefya-purple/30 hover:shadow-enterprise sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8"
          >
            <Thumbnail accent="bg-telefya-purple" />
            <div>
              <span className="inline-flex rounded-full bg-purple-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-telefya-purple">
                {featured.category}
              </span>
              <h2 className="mt-4 text-2xl font-black text-navy-900">
                {featured.title}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
                {featured.desc}
              </p>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-navy-300">
                {featured.duration}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-navy-50/60 py-16 sm:py-24">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <h2 className="text-2xl font-black tracking-tight text-navy-900 sm:text-3xl">
            All tutorials
          </h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tutorials.map((item) => (
              <Link
                key={item.title}
                href="#"
                className="group rounded-xl border border-border bg-white p-4 shadow-soft transition-all duration-200 hover:border-telefya-blue/30 hover:shadow-enterprise"
              >
                <Thumbnail />
                <div className="mt-4 flex items-center gap-2">
                  <item.icon size={15} className="text-telefya-blue" />
                  <span className="text-xs font-black uppercase tracking-[0.08em] text-navy-300">
                    {item.category}
                  </span>
                </div>
                <h3 className="mt-2 font-black text-navy-900">{item.title}</h3>
                <p className="mt-1.5 text-sm font-semibold leading-6 text-navy-500">
                  {item.desc}
                </p>
                <p className="mt-3 text-xs font-black text-navy-300">{item.duration}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto flex max-w-[92rem] flex-col items-start justify-between gap-6 rounded-xl border border-border bg-navy-900 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:px-14">
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Want a walkthrough for your specific setup?
            </h2>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/60">
              Enterprise customers can request a guided onboarding session
              with our solutions team.
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