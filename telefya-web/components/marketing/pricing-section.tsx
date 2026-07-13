"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  Code2,
  Crown,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useAuthState } from "@/hooks/use-auth-state";

type Plan = {
  code: "free" | "pro" | "business" | "enterprise" | "platform";
  name: string;
  price: string;
  suffix: string;
  desc: string;
  cta: string;
  href: string;
  authHref: string;
  icon: LucideIcon;
  popular?: boolean;
  points: string[];
  limits: string[];
};

const plans: Plan[] = [
  {
    code: "free",
    name: "Free",
    price: "$0",
    suffix: "/forever",
    desc: "For individuals testing secure video meetings.",
    cta: "Get started",
    href: "/register?plan=free",
    authHref: "/choose-plan?plan=free",
    icon: Video,
    limits: ["4 participants", "40-minute meetings"],
    points: ["Chat and screen sharing", "Basic workspace access", "Email support"],
  },
  {
    code: "pro",
    name: "Pro",
    price: "$8",
    suffix: "/user/month",
    desc: "For teams that need longer meetings and recordings.",
    cta: "Start Pro",
    href: "/register?plan=pro",
    authHref: "/choose-plan?plan=pro",
    icon: Crown,
    limits: ["50 participants", "5-hour meetings"],
    points: ["Meeting recording", "Analytics access", "25GB storage"],
  },
  {
    code: "business",
    name: "Business",
    price: "$16",
    suffix: "/user/month",
    desc: "For companies running larger meetings and events.",
    cta: "Start Business",
    href: "/register?plan=business",
    authHref: "/choose-plan?plan=business",
    icon: Building2,
    popular: true,
    limits: ["100 participants", "12-hour meetings"],
    points: ["Priority support", "Team controls", "100GB storage"],
  },
  {
    code: "enterprise",
    name: "Enterprise",
    price: "Custom",
    suffix: "/year",
    desc: "For large organizations with advanced requirements.",
    cta: "Contact sales",
    href: "/contact-sales",
    authHref: "/choose-plan?plan=enterprise",
    icon: Building2,
    limits: ["Custom capacity", "Custom retention"],
    points: ["Advanced security", "Dedicated support", "Custom governance"],
  },
  {
    code: "platform",
    name: "Platform",
    price: "Custom",
    suffix: "/month",
    desc: "For developers embedding Telefya into products.",
    cta: "Learn more",
    href: "/contact-sales",
    authHref: "/contact-sales",
    icon: Code2,
    limits: ["API access", "White-label options"],
    points: ["Scalable infrastructure", "Developer support", "Private deployment"],
  },
];

export function PricingSection() {
  const { authenticated } = useAuthState();

  return (
    <section id="pricing" className="border-t border-border bg-white py-20">
      <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
              Pricing
            </span>

            <h2 className="mt-5 max-w-2xl text-4xl font-black leading-tight text-navy-900">
              Plans that scale with your meetings.
            </h2>
          </div>

          <p className="max-w-2xl text-sm font-semibold leading-7 text-navy-500 lg:justify-self-end">
            Start free, then upgrade when your team needs longer calls, larger
            rooms, recording, analytics, storage, and business controls.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const href = authenticated ? plan.authHref : plan.href;

            return (
              <article
                key={plan.code}
                className={[
                  "relative flex min-h-[480px] flex-col rounded-2xl border bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-enterprise",
                  plan.popular
                    ? "border-telefya-violet ring-2 ring-telefya-violet/15"
                    : "border-border",
                ].join(" ")}
              >
                {plan.popular ? (
                  <span className="absolute right-4 top-4 rounded-full bg-telefya-violet px-3 py-1 text-xs font-black text-white">
                    Popular
                  </span>
                ) : null}

                <div
                  className={[
                    "grid h-11 w-11 place-items-center rounded-xl",
                    plan.popular
                      ? "bg-telefya-violet/10 text-telefya-violet"
                      : "bg-blue-50 text-telefya-blue",
                  ].join(" ")}
                >
                  <Icon size={20} />
                </div>

                <h3 className="mt-5 text-xl font-black text-navy-900">
                  {plan.name}
                </h3>

                <p className="mt-2 min-h-14 text-sm font-semibold leading-6 text-navy-500">
                  {plan.desc}
                </p>

                <div className="mt-6 flex items-end gap-1">
                  <strong className="text-4xl font-black text-navy-900">
                    {plan.price}
                  </strong>
                  <span className="pb-1 text-xs font-bold text-navy-400">
                    {plan.suffix}
                  </span>
                </div>

                <div className="mt-6 grid gap-2 rounded-xl bg-navy-50 p-3">
                  {plan.limits.map((limit) => (
                    <div
                      key={limit}
                      className="flex items-center gap-2 text-xs font-black text-navy-700"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-telefya-green" />
                      {limit}
                    </div>
                  ))}
                </div>

                <ul className="mt-6 grid gap-3 text-sm font-semibold text-navy-600">
                  {plan.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0 text-telefya-green"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={href}
                  className={[
                    "mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition",
                    plan.popular
                      ? "bg-telefya-violet text-white hover:bg-telefya-purple"
                      : "border border-telefya-blue text-telefya-blue hover:bg-blue-50",
                  ].join(" ")}
                >
                  {authenticated && plan.href.startsWith("/register")
                    ? `Choose ${plan.name}`
                    : plan.cta}
                  <ArrowRight size={16} />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}