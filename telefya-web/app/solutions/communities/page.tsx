import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarPlus,
  CheckCircle2,
  Heart,
  Lock,
  MessageSquare,
  MonitorUp,
  Phone,
  Sparkles,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1400&q=80",
  secondary:
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
};

const stats = [
  { value: "5,000+", label: "Members supported in a single community" },
  { value: "45%", label: "More recurring attendance at weekly events" },
  { value: "0", label: "Cost per member to join a session" },
  { value: "24/7", label: "Async chat available between live events" },
];

const benefits = [
  {
    icon: Video,
    title: "Weekly gatherings",
    desc: "Recurring meetups, book clubs, and support circles with a single link members can bookmark.",
  },
  {
    icon: MessageSquare,
    title: "Member chat",
    desc: "Ongoing discussion channels that keep the community alive between live sessions.",
  },
  {
    icon: Phone,
    title: "1:1 mentorship calls",
    desc: "Give members a way to book direct time with organizers, mentors, or peer leaders.",
  },
  {
    icon: CalendarPlus,
    title: "Event scheduling",
    desc: "Publish a shared calendar so members always know what's coming up and can RSVP in one tap.",
  },
  {
    icon: MonitorUp,
    title: "Guest speaker sessions",
    desc: "Host larger open events and panels without hitting participant limits mid-conversation.",
  },
  {
    icon: BarChart3,
    title: "Engagement insight",
    desc: "See which events and channels members actually return to, so you can invest where it counts.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Organizer sets the calendar",
    desc: "Recurring events go live once and repeat automatically, so nothing depends on manual re-invites.",
  },
  {
    step: "02",
    title: "Members join from anywhere",
    desc: "One link works across devices — no account gatekeeping members away from the group.",
  },
  {
    step: "03",
    title: "Conversation continues after",
    desc: "Chat stays open between sessions, keeping the community active instead of going quiet for a week.",
  },
];

const trustPoints = [
  { icon: Lock, title: "Private by default", desc: "Community spaces stay invite-only unless organizers choose to open them." },
  { icon: Heart, title: "Built for belonging", desc: "Designed around recurring, relationship-based gatherings, not one-off corporate calls." },
  { icon: Sparkles, title: "Free to start", desc: "Organizers can launch a community workspace without an enterprise contract." },
];

export default function CommunitiesSolutionPage() {
  return (
    <main className="bg-white">
      <MarketingNavbar />

      {/* Hero */}
      <section className="telefya-aurora overflow-hidden">
        <div className="mx-auto grid max-w-[92rem] gap-10 px-5 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-green">
              <Users size={14} />
              Communities
            </span>

            <h1 className="mt-5 text-[clamp(2rem,6vw,3.25rem)] font-black leading-[1.08] tracking-tight text-navy-900">
              Bring your people together, week after week.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-8 text-navy-500 sm:text-lg">
              Telefya gives organizers a reliable home for meetups, support
              groups, and member circles built to keep a community
              connected between events, not just during them.
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
              Used by nonprofits, hobbyist groups, support circles, and
              membership organizations of every size.
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-border shadow-enterprise">
              <img
                src={IMAGES.hero}
                alt="Diverse group of people connecting together"
                className="h-[320px] w-full object-cover sm:h-[420px]"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-enterprise sm:flex">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-telefya-green">
                <Heart size={18} />
              </span>
              <div>
                <p className="text-sm font-black text-navy-900">Weekly circle</p>
                <p className="text-xs font-semibold text-navy-500">38 members joined tonight</p>
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
              alt="Community members gathered together"
              className="h-[280px] w-full object-cover sm:h-[360px]"
              loading="lazy"
            />
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
              Why it matters
            </span>

            <h2 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Communities die in the gap between events.
            </h2>

            <p className="mt-4 leading-7 text-navy-500">
              A group is easy to start and hard to keep alive. Members drift
              when the only touchpoint is a single weekly call with no
              thread connecting it to the next one. A shared space for
              live gatherings and ongoing conversation is what turns a
              one-time meetup into something people keep coming back to.
            </p>

            <ul className="mt-6 grid gap-3">
              {[
                "Consistent attendance when one link works every single week",
                "Continuity between sessions instead of starting from zero",
                "Room to grow from a small circle to hundreds of members",
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
              Built for organizers
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Everything a thriving community runs on
            </h2>
            <p className="mt-4 leading-7 text-navy-500">
              One workspace for the weekly gathering, the ongoing chat, the
              mentorship call, and the sense of who's actually sticking
              around.
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
            From first meetup to a real community
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
            <Heart size={18} className="text-telefya-green" />
            <span className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
              Built for the people who show up
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
            &ldquo;We went from a monthly meetup that half the group forgot
            about to a weekly circle people actually plan their evening
            around. Having one home for it made all the difference.&rdquo;
          </p>
          <p className="mt-5 text-sm font-black text-navy-500">
            Founder, peer support and mentorship circle
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-50/60 py-16 sm:py-20">
        <div className="mx-auto flex max-w-[92rem] flex-col items-start justify-between gap-6 rounded-xl border border-border bg-navy-900 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:px-14">
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Ready to give your community a home?
            </h2>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/60">
              Start free and set up your first gathering in minutes.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-telefya-blue px-6 text-sm font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet"
          >
            Start free
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}