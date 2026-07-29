import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarPlus,
  CheckCircle2,
  Headset,
  Lock,
  MessageSquare,
  MonitorUp,
  Phone,
  ShoppingBag,
  ShoppingCart,
  Truck,
  UserRound,
  Video,
} from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80",
  secondary:
    "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80",
};

const stats = [
  { value: "28%", label: "Higher conversion on virtual consultations" },
  { value: "2x", label: "Faster resolution on live video support" },
  { value: "150+", label: "Concurrent shoppers per live shopping event" },
  { value: "0", label: "App installs required for customers" },
];

const benefits = [
  {
    icon: Video,
    title: "Live shopping events",
    desc: "Host product launches and demos with real-time chat and checkout links, without a separate streaming stack.",
  },
  {
    icon: Headset,
    title: "Video customer support",
    desc: "Escalate complex support cases from chat to face-to-face video without switching platforms.",
  },
  {
    icon: MessageSquare,
    title: "Sales & support chat",
    desc: "Persistent chat between shoppers and your team, tied to the same session as the video call.",
  },
  {
    icon: Phone,
    title: "Personal shopping line",
    desc: "Offer a dedicated line for VIP or high-touch clients to reach a specialist directly.",
  },
  {
    icon: CalendarPlus,
    title: "Appointment styling & demos",
    desc: "Let customers book one-on-one product consultations against your team's real availability.",
  },
  {
    icon: BarChart3,
    title: "Conversion analytics",
    desc: "See which live sessions and consultations actually drive purchases, not just attendance.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Customer books or joins live",
    desc: "A consultation link or live event goes out through your existing storefront or email flow.",
  },
  {
    step: "02",
    title: "Specialist joins on brand",
    desc: "Your team greets the customer in a branded room, no download required on either side.",
  },
  {
    step: "03",
    title: "Session data feeds your funnel",
    desc: "Attendance and outcomes flow back into your analytics to measure what's actually converting.",
  },
];

const trustPoints = [
  { icon: Lock, title: "Encrypted checkout conversations", desc: "Payment and account discussions stay encrypted end to end." },
  { icon: ShoppingBag, title: "Branded experience", desc: "Custom room branding so every session looks and feels like your storefront." },
  { icon: Truck, title: "Reliable under load", desc: "Built to hold up during flash sales and peak live-shopping traffic." },
];

export default function RetailEcommerceSolutionPage() {
  return (
    <main className="bg-white">
      <MarketingNavbar />

      {/* Hero */}
      <section className="telefya-aurora overflow-hidden">
        <div className="mx-auto grid max-w-[92rem] gap-10 px-5 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-purple">
              <ShoppingCart size={14} />
              Retail & E-commerce
            </span>

            <h1 className="mt-5 text-[clamp(2rem,6vw,3.25rem)] font-black leading-[1.08] tracking-tight text-navy-900">
              Turn conversations into conversions.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-8 text-navy-500 sm:text-lg">
              Telefya gives retail and e-commerce teams a live video and
              chat layer for shopping events, styling sessions, and support
              escalations built to plug into the storefront you already
              run.
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
              Used by DTC brands, marketplaces, and specialty retailers
              running live shopping and video-first support.
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-border shadow-enterprise">
              <img
                src={IMAGES.hero}
                alt="Retail store representing shopping and customer experience"
                className="h-[320px] w-full object-cover sm:h-[420px]"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-enterprise sm:flex">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-purple-50 text-telefya-purple">
                <ShoppingBag size={18} />
              </span>
              <div>
                <p className="text-sm font-black text-navy-900">Live event</p>
                <p className="text-xs font-semibold text-navy-500">Spring collection launch</p>
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
              alt="Customer being helped at a retail checkout"
              className="h-[280px] w-full object-cover sm:h-[360px]"
              loading="lazy"
            />
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
              Why it matters
            </span>

            <h2 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Shoppers convert when they can ask a real question.
            </h2>

            <p className="mt-4 leading-7 text-navy-500">
              A product page can't answer 'will this actually work for me.''
              Text-only support chat stalls out on anything that needs a
              real explanation. Live video closes that gap turning
              hesitant browsers into buyers and turning frustrated support
              tickets into resolved ones, in a single session.
            </p>

            <ul className="mt-6 grid gap-3">
              {[
                "Higher conversion on considered or high-value purchases",
                "Fewer returns when customers see the product before buying",
                "Faster resolution for support cases that need real explanation",
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
              Built for retail teams
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
              Everything a modern storefront runs on
            </h2>
            <p className="mt-4 leading-7 text-navy-500">
              One workspace for the live event, the support escalation, the
              styling appointment, and the data that shows whats actually
              driving revenue.
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
            From click to conversation in three steps
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
              Built to protect customer trust
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
            &ldquo;Our live styling sessions convert at nearly three times
            the rate of the product page alone. Customers just need to see
            it on a real person before they commit.&rdquo;
          </p>
          <p className="mt-5 text-sm font-black text-navy-500">
            Head of Customer Experience, direct-to-consumer apparel brand
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-50/60 py-16 sm:py-20">
        <div className="mx-auto flex max-w-[92rem] flex-col items-start justify-between gap-6 rounded-xl border border-border bg-navy-900 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:px-14">
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Ready to bring live video to your storefront?
            </h2>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/60">
              Talk to our team about live shopping and video support for
              your brand.
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