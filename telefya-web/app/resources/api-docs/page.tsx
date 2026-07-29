import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Calendar,
  Code2,
  KeyRound,
  MessageSquare,
  Video,
  Webhook,
} from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";

const apis = [
  {
    icon: Video,
    title: "Meetings API",
    desc: "Create, schedule, and manage meeting rooms programmatically from your own product.",
  },
  {
    icon: MessageSquare,
    title: "Chat API",
    desc: "Send and retrieve messages within a meeting or persistent channel context.",
  },
  {
    icon: Calendar,
    title: "Scheduling API",
    desc: "Sync availability and bookings between Telefya and your existing calendar systems.",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    desc: "Subscribe to session, recording, and participant events as they occur in real time.",
  },
  {
    icon: KeyRound,
    title: "Identity & Auth",
    desc: "Issue scoped access tokens and provision users through your identity provider.",
  },
  {
    icon: BellRing,
    title: "Notifications API",
    desc: "Trigger reminders and status updates through your own notification channels.",
  },
];

const languages = ["REST", "Node.js", "Python", "WebSockets", "GraphQL (beta)"];

export default function ApiDocumentationPage() {
  return (
    <main className="bg-white">
      <MarketingNavbar />

      {/* Hero */}
      <section className="telefya-aurora overflow-hidden">
        <div className="mx-auto grid max-w-[92rem] gap-10 px-5 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
              <Code2 size={14} />
              Developer Resources
            </span>

            <h1 className="mt-5 text-[clamp(2rem,6vw,3.25rem)] font-black leading-[1.08] tracking-tight text-navy-900">
              Build on the Telefya platform.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-8 text-navy-500 sm:text-lg">
              Integrate meetings, chat, scheduling, and real-time events
              directly into your product with a documented, versioned API.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact-sales"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-telefya-blue px-6 text-sm font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet hover:shadow-enterprise"
              >
                Request API access
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-white px-6 text-sm font-black text-navy-900 transition-all duration-200 hover:border-telefya-blue hover:text-telefya-blue"
              >
                Create an account
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-navy-900 shadow-enterprise">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-telefya-coral" />
              <span className="h-2.5 w-2.5 rounded-full bg-telefya-gold" />
              <span className="h-2.5 w-2.5 rounded-full bg-telefya-green" />
              <span className="ml-2 text-xs font-semibold text-white/40">
                create-meeting.ts
              </span>
            </div>
            <pre className="overflow-x-auto p-5 text-[13px] leading-6 text-white/85">
{`const meeting = await telefya.meetings.create({
  title: "Quarterly Business Review",
  startTime: "2026-08-04T15:00:00Z",
  hostId: "usr_8f2a1c",
  recording: { enabled: true },
});

console.log(meeting.joinUrl);
// https://telefya.com/join/qbr-4821`}
            </pre>
          </div>
        </div>
      </section>

      {/* API grid */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
              API surface
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Everything you need to embed Telefya
            </h2>
            <p className="mt-4 leading-7 text-navy-500">
              Each API is versioned independently and documented with
              request and response schemas, rate limits, and error codes.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apis.map((item) => (
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

      {/* Language support */}
      <section className="bg-navy-50/60 py-16 sm:py-20">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <div className="rounded-xl border border-border bg-white p-6 shadow-soft sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-navy-300">
              Supported protocols and SDKs
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {languages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-lg border border-border bg-navy-50 px-3.5 py-2 text-sm font-black text-navy-700"
                >
                  {lang}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm font-semibold leading-6 text-navy-500">
              Additional client libraries are released on a rolling basis.
              Enterprise accounts can request priority support for a
              specific language or framework.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto flex max-w-[92rem] flex-col items-start justify-between gap-6 rounded-xl border border-border bg-navy-900 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:px-14">
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Ready to integrate Telefya into your product?
            </h2>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/60">
              Request API access to receive credentials and environment
              documentation.
            </p>
          </div>
          <Link
            href="/contact-sales"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-telefya-blue px-6 text-sm font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet"
          >
            Request access
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}