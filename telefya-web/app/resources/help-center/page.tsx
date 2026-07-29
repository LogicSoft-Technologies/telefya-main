import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Headphones,
  LayoutGrid,
  Plug,
  Search,
  ShieldCheck,
  Video,
  Wrench,
} from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";

const categories = [
  {
    icon: LayoutGrid,
    title: "Getting Started",
    desc: "Account setup, workspace configuration, and your first meeting.",
    articles: 12,
  },
  {
    icon: Video,
    title: "Meetings & Rooms",
    desc: "Scheduling, hosting controls, recording, and in-meeting features.",
    articles: 24,
  },
  {
    icon: CreditCard,
    title: "Account & Billing",
    desc: "Plans, invoicing, seat management, and payment methods.",
    articles: 9,
  },
  {
    icon: ShieldCheck,
    title: "Admin & Security",
    desc: "SSO, permissions, retention policy, and workspace governance.",
    articles: 15,
  },
  {
    icon: Plug,
    title: "Integrations",
    desc: "Calendar sync, API access, and third-party connections.",
    articles: 8,
  },
  {
    icon: Wrench,
    title: "Troubleshooting",
    desc: "Connection issues, device settings, and known limitations.",
    articles: 18,
  },
];

const popular = [
  "Setting up single sign-on for your organization",
  "Configuring recording and retention policy",
  "Resolving audio and video connection issues",
  "Managing seats and billing for your workspace",
  "Provisioning users through SCIM",
];

export default function HelpCenterPage() {
  return (
    <main className="bg-white">
      <MarketingNavbar />

      {/* Hero */}
      <section className="telefya-aurora overflow-hidden">
        <div className="mx-auto max-w-[92rem] px-5 py-14 sm:py-20 lg:px-8 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
            <Headphones size={14} />
            Help Center
          </span>

          <h1 className="mt-5 max-w-2xl text-[clamp(2rem,6vw,3.25rem)] font-black leading-[1.08] tracking-tight text-navy-900">
            Answers for hosts, administrators, and attendees.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-navy-500 sm:text-lg">
            Search our documentation or browse by category to find guidance
            on setup, administration, and troubleshooting.
          </p>

          <div className="mt-8 flex h-14 max-w-xl items-center gap-3 rounded-xl border border-border bg-white px-5 shadow-soft">
            <Search size={18} className="shrink-0 text-navy-300" />
            <span className="text-sm font-semibold text-navy-300">
              Search help articles (e.g. "reset password", "SSO setup")
            </span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <h2 className="text-2xl font-black tracking-tight text-navy-900 sm:text-3xl">
            Browse by category
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((item) => (
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
                <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-navy-300">
                  {item.articles} articles
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular articles */}
      <section className="bg-navy-50/60 py-16 sm:py-24">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <h2 className="text-2xl font-black tracking-tight text-navy-900 sm:text-3xl">
            Popular articles
          </h2>

          <div className="mt-8 grid gap-3">
            {popular.map((title) => (
              <div
                key={title}
                className="flex items-center justify-between rounded-xl border border-border bg-white p-4 shadow-soft transition-all duration-200 hover:border-telefya-blue/30 sm:p-5"
              >
                <span className="text-sm font-black text-navy-900">{title}</span>
                <ArrowRight size={16} className="shrink-0 text-navy-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto flex max-w-[92rem] flex-col items-start justify-between gap-6 rounded-xl border border-border bg-navy-900 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:px-14">
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Can't find what you're looking for?
            </h2>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/60">
              Our support team is available to help with account, billing,
              and technical issues.
            </p>
          </div>
          <Link
            href="/contact-sales"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-telefya-blue px-6 text-sm font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet"
          >
            Contact support
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}