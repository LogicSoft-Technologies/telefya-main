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
    desc: "Connect your product to Telefya meetings, rooms, and user workflows.",
    icon: Code2,
    href: "#",
  },
  {
    title: "Security Center",
    desc: "Learn how Telefya protects meetings, accounts, and organizations.",
    icon: ShieldCheck,
    href: "#",
  },
  {
    title: "Help Center",
    desc: "Guides for hosts, speakers, admins, and attendees.",
    icon: Headphones,
    href: "#",
  },
  {
    title: "Video Tutorials",
    desc: "Watch product walkthroughs for live sessions and events.",
    icon: Video,
    href: "#",
  },
  {
    title: "Implementation Guides",
    desc: "Step-by-step setup for teams, platforms, and developers.",
    icon: BookOpen,
    href: "#",
  },
  {
    title: "Release Notes",
    desc: "Follow product updates, fixes, and platform improvements.",
    icon: FileText,
    href: "#",
  },
];

export function ResourcesSection() {
  return (
    <section id="resources" className="bg-navy-50 py-20">
      <div className="mx-auto max-w-[92rem] px-5 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-telefya-violet">
              Resources
            </span>

            <h2 className="mt-5 max-w-2xl text-4xl font-black text-navy-900">
              Everything your team needs to build, launch, and support Telefya.
            </h2>
          </div>

          <p className="max-w-xl leading-7 text-navy-500">
            Explore docs, guides, security details, and support resources built
            for product teams and enterprise operators.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-2xl border border-border bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-telefya-blue"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-telefya-blue">
                <item.icon size={24} />
              </div>

              <h3 className="mt-6 text-xl font-black text-navy-900">
                {item.title}
              </h3>

              <p className="mt-3 leading-7 text-navy-500">{item.desc}</p>

              <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-telefya-blue">
                View resource <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}