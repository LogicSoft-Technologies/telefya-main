import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";

const footerGroups = [
  {
    title: "Platform",
    links: [
      "Meetings",
      "Webinars",
      "Live Stage",
      "Conference Lobby",
      "Speaker Dashboard",
      "Host Console",
    ],
  },
  {
    title: "Solutions",
    links: [
      "Healthcare",
      "Education",
      "Enterprise",
      "Government",
      "Retail",
      "Communities",
    ],
  },
  {
    title: "Resources",
    links: [
      "Pricing",
      "Security",
      "API Docs",
      "Help Center",
      "System Status",
      "Contact Sales",
    ],
  },
  {
    title: "Company",
    links: [
      "About Telefya",
      "Careers",
      "Partners",
      "Privacy",
      "Terms",
      "Compliance",
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden bg-navy-900 text-white">
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-telefya-violet/12 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-telefya-blue/12 blur-3xl" />

      <div className="relative mx-auto max-w-[92rem] px-5 py-16 lg:px-8">
        <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <Link href="/" className="inline-block">
              <div className="inline-flex items-center rounded-md bg-white px-3 py-2">
                <Image
                  src="/images/telefya-logo.png"
                  alt="Telefya"
                  width={148}
                  height={44}
                  className="h-8 w-auto"
                />
              </div>
            </Link>

            <h2 className="mt-7 max-w-xl text-3xl font-black leading-tight tracking-tight md:text-4xl">
              Enterprise video meetings and collaboration built for serious teams.
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-7 text-white/50">
              Telefya gives organizations one place to run live sessions, manage speakers, support attendees, and control the full communication experience.
            </p>
          </div>

          <div className="rounded-md border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-black">Talk to sales</h3>
            <p className="mt-2.5 text-sm leading-6 text-white/55">
              Build secure meetings, live events, and admin workflows around your organization.
            </p>

            <Link
              href="/contact-sales"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-telefya-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-telefya-violet"
            >
              Contact sales <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-white/40">Contact</h4>
            <div className="mt-4 grid gap-3.5 text-sm text-white/55">
              <span className="flex items-center gap-2.5">
                <Mail size={14} className="shrink-0 text-telefya-blue" />
                hello@telefya.com
              </span>
              <span className="flex items-center gap-2.5">
                <Phone size={14} className="shrink-0 text-telefya-green" />
                Sales support
              </span>
              <span className="flex items-center gap-2.5">
                <MapPin size={14} className="shrink-0 text-telefya-gold" />
                Remote-first platform
              </span>
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-white/40">
                {group.title}
              </h4>
              <div className="mt-4 grid gap-3 text-sm text-white/55">
                {group.links.map((link) => (
                  <Link
                    key={link}
                    href="#"
                    className="w-fit transition-colors hover:text-white"
                  >
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-7 text-xs text-white/35 md:flex-row md:items-center">
          <p>© 2026 Telefya. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="#" className="transition-colors hover:text-white/70">Privacy</Link>
            <Link href="#" className="transition-colors hover:text-white/70">Terms</Link>
            <Link href="#" className="transition-colors hover:text-white/70">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}