import Link from "next/link";
import { ArrowRight, FileText, Mail } from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";

type EntryTag = "New" | "Improved" | "Fixed";

const tagStyles: Record<EntryTag, string> = {
  New: "bg-emerald-50 text-telefya-green",
  Improved: "bg-blue-50 text-telefya-blue",
  Fixed: "bg-amber-50 text-telefya-gold",
};

const releases = [
  {
    version: "v4.6.0",
    date: "July 21, 2026",
    entries: [
      { tag: "New" as EntryTag, text: "Virtual background support added to the web client, with automatic segmentation." },
      { tag: "New" as EntryTag, text: "Analytics dashboard now supports department-level filtering." },
      { tag: "Improved" as EntryTag, text: "Reduced reconnection time after temporary network loss during meetings." },
    ],
  },
  {
    version: "v4.5.2",
    date: "July 8, 2026",
    entries: [
      { tag: "Fixed" as EntryTag, text: "Resolved an issue where recordings could fail to finalize after upload interruptions." },
      { tag: "Improved" as EntryTag, text: "Mobile app navigation restructured for faster access to Settings and Recordings." },
    ],
  },
  {
    version: "v4.5.0",
    date: "June 19, 2026",
    entries: [
      { tag: "New" as EntryTag, text: "Live Stage now supports moderated audience Q&A for events over 500 attendees." },
      { tag: "New" as EntryTag, text: "Scheduling API released for calendar and booking integrations." },
      { tag: "Improved" as EntryTag, text: "Chat sidebar redesigned for the live meeting room on web." },
    ],
  },
  {
    version: "v4.4.1",
    date: "June 2, 2026",
    entries: [
      { tag: "Fixed" as EntryTag, text: "Corrected a display issue affecting self-view layout on smaller viewports." },
      { tag: "Fixed" as EntryTag, text: "Resolved intermittent audio drift during extended screen-share sessions." },
    ],
  },
];

export default function ReleaseNotesPage() {
  return (
    <main className="bg-white">
      <MarketingNavbar />

      {/* Hero */}
      <section className="telefya-aurora overflow-hidden">
        <div className="mx-auto max-w-[92rem] px-5 py-14 sm:py-20 lg:px-8 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-telefya-blue">
            <FileText size={14} />
            Release Notes
          </span>

          <h1 className="mt-5 max-w-2xl text-[clamp(2rem,6vw,3.25rem)] font-black leading-[1.08] tracking-tight text-navy-900">
            A record of platform updates and improvements.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-navy-500 sm:text-lg">
            Track new features, performance improvements, and fixes as they
            ship across the Telefya web, mobile, and API platforms.
          </p>
        </div>
      </section>

      {/* Changelog */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-5 lg:px-8">
          <div className="grid gap-6">
            {releases.map((release) => (
              <div
                key={release.version}
                className="rounded-xl border border-border bg-white p-6 shadow-soft sm:p-8"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-xl font-black text-navy-900">{release.version}</h2>
                  <span className="text-xs font-black uppercase tracking-[0.1em] text-navy-300">
                    {release.date}
                  </span>
                </div>

                <ul className="mt-5 grid gap-3">
                  {release.entries.map((entry, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.06em] ${tagStyles[entry.tag]}`}
                      >
                        {entry.tag}
                      </span>
                      <span className="text-sm font-semibold leading-6 text-navy-600">
                        {entry.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="bg-navy-50/60 py-16 sm:py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-6 rounded-xl border border-border bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-telefya-blue">
              <Mail size={20} />
            </span>
            <div>
              <h3 className="font-black text-navy-900">Get release updates by email</h3>
              <p className="mt-1 max-w-md text-sm font-semibold leading-6 text-navy-500">
                Receive a summary each time a new version ships.
              </p>
            </div>
          </div>
          <Link
            href="/contact-sales"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-telefya-blue px-5 text-sm font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet"
          >
            Subscribe
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}