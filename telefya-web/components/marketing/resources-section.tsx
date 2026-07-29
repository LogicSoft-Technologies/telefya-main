import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Code2,
  FileText,
  Headphones,
  ShieldCheck,
  Video,
} from "lucide-react";

const resources = [
  {
    title: "API Documentation",
    desc: "Integrate Telefya meetings, rooms, and user workflows into your product.",
    icon: Code2,
    href: "/resources/api-docs",
  },
  {
    title: "Security Center",
    desc: "Review how Telefya protects accounts, sessions, and organizational data.",
    icon: ShieldCheck,
    href: "/resources/security",
  },
  {
    title: "Help Center",
    desc: "Reference guides for hosts, administrators, and attendees.",
    icon: Headphones,
    href: "/resources/help-center",
  },
  {
    title: "Video Tutorials",
    desc: "Product walkthroughs covering setup, live sessions, and events.",
    icon: Video,
    href: "/resources/tutorials",
  },
  {
    title: "Implementation Guides",
    desc: "Structured rollout guidance for teams, platforms, and developers.",
    icon: BookOpen,
    href: "/resources/implementation-guides",
  },
  {
    title: "Release Notes",
    desc: "A record of product updates, fixes, and platform improvements.",
    icon: FileText,
    href: "/resources/release-notes",
  },
];

export function ResourcesSection() {
  return (
    <section id="resources" className="bg-navy-50 py-16 sm:py-24">
      <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:mb-12 lg:flex-row lg:items-end">
          <div>
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-violet shadow-soft">
              Resources
            </span>

            <h2 className="mt-5 max-w-2xl text-[clamp(2rem,6vw,2.75rem)] font-black leading-[1.1] tracking-tight text-navy-900">
              Documentation and support for every stage of implementation.
            </h2>
          </div>

          <p className="max-w-xl leading-7 text-navy-500">
            Reference material, security documentation, and support
            resources for product teams and enterprise operators.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {resources.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-xl border border-border bg-white p-6 shadow-soft transition-all duration-200 hover:border-telefya-blue/30 hover:shadow-enterprise"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-telefya-blue transition-colors duration-200 group-hover:bg-telefya-blue group-hover:text-white">
                <item.icon size={20} />
              </span>

              <h3 className="mt-5 font-black text-navy-900">{item.title}</h3>

              <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
                {item.desc}
              </p>

              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-telefya-blue">
                View resource
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}