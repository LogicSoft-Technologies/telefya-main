import Link from "next/link";
import {
  ArrowRight,
  Bug,
  Fingerprint,
  KeyRound,
  Lock,
  Server,
  ShieldCheck,
} from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";

const pillars = [
  {
    icon: Lock,
    title: "Data protection",
    desc: "Video, audio, and messaging data is encrypted in transit across every session. Storage access is governed by role-based permissions and logged for audit purposes.",
  },
  {
    icon: Fingerprint,
    title: "Identity & access",
    desc: "Single sign-on, multi-factor authentication, and SCIM provisioning integrate with your existing identity provider to enforce consistent access policy.",
  },
  {
    icon: Server,
    title: "Infrastructure reliability",
    desc: "Media routing runs across redundant regional infrastructure, with monitoring and failover designed to minimize service disruption.",
  },
  {
    icon: KeyRound,
    title: "Granular permissions",
    desc: "Administrators control recording, retention, and sharing policy at the organization, workspace, and meeting level.",
  },
];

const practices = [
  "Encrypted media and messaging in transit, by default",
  "Configurable data retention and recording policy per workspace",
  "Audit logs for administrative and session-level activity",
  "Regular internal review of infrastructure and access controls",
  "Documented incident response process for service disruptions",
];

export default function SecurityCenterPage() {
  return (
    <main className="bg-white">
      <MarketingNavbar />

      {/* Hero */}
      <section className="telefya-aurora overflow-hidden">
        <div className="mx-auto max-w-[92rem] px-5 py-14 sm:py-20 lg:px-8 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-green">
            <ShieldCheck size={14} />
            Security Center
          </span>

          <h1 className="mt-5 max-w-2xl text-[clamp(2rem,6vw,3.25rem)] font-black leading-[1.08] tracking-tight text-navy-900">
            How Telefya protects your organization's data.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-navy-500 sm:text-lg">
            An overview of the controls, infrastructure practices, and
            policies Telefya applies to protect accounts, sessions, and
            organizational data.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact-sales"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-telefya-blue px-6 text-sm font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet hover:shadow-enterprise"
            >
              Contact our security team
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/resources/api-docs"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-white px-6 text-sm font-black text-navy-900 transition-all duration-200 hover:border-telefya-blue hover:text-telefya-blue"
            >
              View API documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {pillars.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-white p-6 shadow-soft transition-all duration-200 hover:border-telefya-green/30 hover:shadow-enterprise sm:p-7"
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

      {/* Practices list */}
      <section className="bg-navy-900 py-16 sm:py-24">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/70">
              Operating practices
            </span>
            <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
              What this looks like in practice
            </h2>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {practices.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4"
              >
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-telefya-green" />
                <span className="text-sm font-semibold leading-6 text-white/80">{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 max-w-2xl text-xs font-semibold leading-5 text-white/40">
            Security practices and infrastructure are reviewed and updated on
            an ongoing basis. Enterprise customers can request a detailed
            security questionnaire or documentation package through our
            sales team.
          </p>
        </div>
      </section>

      {/* Disclosure */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-border bg-navy-50/60 p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-telefya-coral shadow-soft">
                <Bug size={20} />
              </span>
              <div>
                <h3 className="font-black text-navy-900">
                  Found a security issue?
                </h3>
                <p className="mt-1 max-w-md text-sm font-semibold leading-6 text-navy-500">
                  We welcome reports through responsible disclosure. Contact
                  our security team directly rather than filing a public
                  report.
                </p>
              </div>
            </div>
            <Link
              href="/contact-sales"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-black text-navy-900 transition-all duration-200 hover:border-telefya-blue hover:text-telefya-blue"
            >
              Report an issue
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}