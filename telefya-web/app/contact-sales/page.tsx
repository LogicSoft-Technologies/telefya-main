"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Globe2,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";

const teamSizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const interestOptions = [
  { code: "enterprise", label: "Enterprise" },
  { code: "platform", label: "Platform / API" },
] as const;

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Enterprise-grade security",
    desc: "SSO, audit logs, and granular workspace controls built for regulated teams.",
  },
  {
    icon: Globe2,
    title: "Global infrastructure",
    desc: "Low-latency Mediasoup routing across regions, with custom deployment options.",
  },
  {
    icon: Clock3,
    title: "Dedicated onboarding",
    desc: "A named solutions engineer helps configure your workspace before rollout.",
  },
];

const faqs = [
  {
    q: "How fast will someone respond?",
    a: "Our sales team replies within one business day. For urgent enterprise migrations, mention your timeline in the message field and we will prioritize accordingly.",
  },
  {
    q: "Do you support custom contracts and invoicing?",
    a: "Yes. Enterprise and Platform plans support annual contracts, custom invoicing, and procurement paperwork including security questionnaires and DPAs.",
  },
  {
    q: "Can we get a private deployment?",
    a: "Platform customers can request a dedicated or on-premise Mediasoup deployment. Our team will scope this during your first call.",
  },
  {
    q: "Is there a trial before committing to Enterprise?",
    a: "Most teams start on Business to validate the workspace, then move to Enterprise once seat count, retention, or governance needs grow. We can also arrange a pilot for qualifying teams.",
  },
];

type FormState = {
  fullName: string;
  workEmail: string;
  company: string;
  teamSize: string;
  phone: string;
  interest: "enterprise" | "platform";
  message: string;
};

const initialForm: FormState = {
  fullName: "",
  workEmail: "",
  company: "",
  teamSize: teamSizes[0],
  phone: "",
  interest: "enterprise",
  message: "",
};

export default function ContactSalesPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.fullName.trim() || !form.workEmail.trim() || !form.company.trim()) {
      setError("Please fill in your name, work email, and company.");
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to send your request.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white lg:flex">
      <aside className="hidden shrink-0 flex-col justify-between overflow-hidden bg-navy-900 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[460px] xl:w-[520px]">
        <div className="telefya-accent-line h-1" />

        <div className="flex flex-1 flex-col justify-between px-8 py-10 xl:px-10">
          <Link
            href="/"
            className="inline-flex w-fit rounded-xl bg-white px-4 py-3 shadow-soft transition-all duration-200 hover:shadow-enterprise"
          >
            <Image
              src="/images/telefya-logo.png"
              alt="Telefya"
              width={152}
              height={46}
              priority
              className="h-9 w-auto"
            />
          </Link>

          <div className="my-10 grid gap-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/70">
                <Sparkles size={15} className="text-telefya-gold" />
                Enterprise sales
              </div>

              <h1 className="mt-5 max-w-md text-4xl font-black leading-tight text-white">
                Let&apos;s build your Telefya deployment.
              </h1>

              <p className="mt-4 max-w-md text-base leading-8 text-white/62">
                Tell us about your team and we will put together a plan for
                capacity, governance, and rollout that fits how you actually
                run meetings.
              </p>
            </div>

            <div className="grid gap-4">
              {trustPoints.map((point) => (
                <div
                  key={point.title}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-telefya-blue">
                    <point.icon size={18} className="text-white" />
                  </span>
                  <div>
                    <p className="font-black text-white">{point.title}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-white/55">
                      {point.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm font-semibold leading-6 text-white/45">
            Trusted by teams running enterprise meetings, live events, and
            embedded video workflows on Telefya.
          </p>
        </div>
      </aside>

      <section className="telefya-aurora flex min-h-screen w-full flex-1 justify-center overflow-y-auto px-6 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-2xl">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Image
              src="/images/telefya-logo.png"
              alt="Telefya"
              width={146}
              height={44}
              priority
              className="h-9 w-auto"
            />
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-black text-navy-500 transition-colors duration-200 hover:text-telefya-blue"
          >
            <ArrowLeft size={17} />
            Back to home
          </Link>

          <div className="mt-6 rounded-xl border border-border bg-white/95 p-6 shadow-enterprise backdrop-blur">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
              Contact sales
            </span>

            <h2 className="mt-5 text-3xl font-black text-navy-900">
              Talk to our sales team
            </h2>

            <p className="mt-2 leading-7 text-navy-500">
              Share a few details and a Telefya solutions engineer will follow
              up with capacity, pricing, and rollout options for your team.
            </p>

            {error ? (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                {error}
              </div>
            ) : null}

            {submitted ? (
              <div className="mt-6 rounded-xl border border-telefya-green/30 bg-telefya-green/10 p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-telefya-green" />
                  <p className="text-lg font-black text-navy-900">
                    Request received
                  </p>
                </div>

                <p className="mt-2 text-sm font-semibold leading-6 text-navy-600">
                  Thanks, {form.fullName.split(" ")[0] || "there"}. Someone from
                  our sales team will reach out to {form.workEmail} within one
                  business day.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setForm(initialForm);
                  }}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-900 transition-all duration-200 hover:border-telefya-blue hover:text-telefya-blue"
                >
                  Send another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    icon={<User size={18} />}
                    value={form.fullName}
                    onChange={(value) => updateField("fullName", value)}
                    placeholder="Jordan Michaels"
                    autoComplete="name"
                  />

                  <Field
                    label="Work email"
                    type="email"
                    icon={<Mail size={18} />}
                    value={form.workEmail}
                    onChange={(value) => updateField("workEmail", value)}
                    placeholder="jordan@company.com"
                    autoComplete="email"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Company"
                    icon={<Building2 size={18} />}
                    value={form.company}
                    onChange={(value) => updateField("company", value)}
                    placeholder="Company Inc."
                    autoComplete="organization"
                  />

                  <Field
                    label="Phone (optional)"
                    type="tel"
                    icon={<Phone size={18} />}
                    value={form.phone}
                    onChange={(value) => updateField("phone", value)}
                    placeholder="+1 555 123 4567"
                    autoComplete="tel"
                    required={false}
                  />
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-black text-navy-900">
                    Team size
                  </span>
                  <span className="flex h-12 items-center gap-3 rounded-xl border border-border bg-white px-4 shadow-soft transition-all duration-200 focus-within:border-telefya-blue focus-within:ring-2 focus-within:ring-telefya-blue/15">
                    <Users size={18} className="shrink-0 text-navy-300" />
                    <select
                      value={form.teamSize}
                      onChange={(event) => updateField("teamSize", event.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-navy-900 outline-none"
                    >
                      {teamSizes.map((size) => (
                        <option key={size} value={size}>
                          {size} people
                        </option>
                      ))}
                    </select>
                  </span>
                </label>

                <div className="grid gap-2">
                  <span className="text-sm font-black text-navy-900">
                    What are you interested in?
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => updateField("interest", option.code)}
                        className={[
                          "inline-flex h-11 items-center rounded-xl border px-4 text-sm font-black transition-all duration-200",
                          form.interest === option.code
                            ? "border-telefya-blue bg-blue-50 text-telefya-blue"
                            : "border-border bg-white text-navy-700 hover:border-telefya-blue/40",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-black text-navy-900">
                    Tell us about your use case
                  </span>
                  <span className="flex items-start gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-soft transition-all duration-200 focus-within:border-telefya-blue focus-within:ring-2 focus-within:ring-telefya-blue/15">
                    <MessageSquare size={18} className="mt-0.5 shrink-0 text-navy-300" />
                    <textarea
                      value={form.message}
                      onChange={(event) => updateField("message", event.target.value)}
                      placeholder="What are you hoping to solve with Telefya? Include timeline, participant volume, or integration needs."
                      rows={4}
                      className="w-full resize-none bg-transparent text-sm font-semibold text-navy-900 outline-none placeholder:text-navy-300"
                    />
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-5 font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet hover:shadow-enterprise disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                  {loading ? "Sending request..." : "Talk to sales"}
                </button>

                <p className="text-center text-xs font-semibold leading-5 text-navy-400">
                  By submitting, you agree to be contacted by the Telefya
                  sales team about your request.
                </p>
              </form>
            )}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {trustPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-xl border border-border bg-white p-4 shadow-soft"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-telefya-blue">
                  <point.icon size={18} />
                </span>
                <p className="mt-3 text-sm font-black text-navy-900">
                  {point.title}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-navy-500">
                  {point.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-navy-300">
              Frequently asked
            </p>
            <h3 className="mt-2 text-2xl font-black text-navy-900">
              Common questions before you talk to us
            </h3>

            <div className="mt-5 grid gap-3">
              {faqs.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-border bg-white p-4 shadow-soft transition-all duration-200 open:border-telefya-blue/40"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black text-navy-900">
                    {item.q}
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-500 transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm font-semibold leading-6 text-navy-500">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  autoComplete,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon: React.ReactNode;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-navy-900">{label}</span>
      <span className="flex h-12 items-center gap-3 rounded-xl border border-border bg-white px-4 shadow-soft transition-all duration-200 focus-within:border-telefya-blue focus-within:ring-2 focus-within:ring-telefya-blue/15">
        <span className="shrink-0 text-navy-300">{icon}</span>
        <input
          type={type}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-semibold text-navy-900 outline-none placeholder:text-navy-300"
        />
      </span>
    </label>
  );
}