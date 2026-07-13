"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Copy,
  Loader2,
  MonitorUp,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";
import { scheduleMeeting } from "@/lib/api/meetings";

function createRoomId() {
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 14);
  return `telefya_${random}`;
}

function getLocalDateTimeValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 15);
  now.setSeconds(0);
  now.setMilliseconds(0);
  return now.toISOString().slice(0, 16);
}

export default function CreateMeetingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("Telefya meeting");
  const [date, setDate] = useState(getLocalDateTimeValue());
  const [timeZone, setTimeZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  const [roomId, setRoomId] = useState(createRoomId());
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const meetingPath = useMemo(() => {
    if (typeof window === "undefined") return `/live/${roomId}`;
    return `${window.location.origin}/live/${roomId}`;
  }, [roomId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreatedLink("");
    setLoading(true);

    try {
      await scheduleMeeting({
        date: new Date(date).toISOString(),
        timeZone,
        path: meetingPath,
        des: title.trim() || "Telefya meeting",
      });

      setCreatedLink(meetingPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to schedule meeting.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!createdLink) return;

    await navigator.clipboard.writeText(createdLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/lobby"
          className="inline-flex items-center gap-2 text-sm font-black text-navy-500 transition-all duration-200 hover:text-telefya-blue"
        >
          <ArrowLeft size={17} />
          Back to lobby
        </Link>

        <button
          onClick={() => router.refresh()}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-700 transition-all duration-200 hover:border-telefya-blue hover:text-telefya-blue"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="rounded-xl border border-border bg-white p-8 shadow-soft transition-shadow duration-200 hover:shadow-enterprise">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-telefya-blue">
            <Sparkles size={15} />
            Meeting setup
          </div>

          <h1 className="mt-6 text-3xl font-black leading-tight text-navy-900">
            Create a secure Telefya meeting
          </h1>

          <p className="mt-4 leading-7 text-navy-500">
            Schedule a room, generate a shareable link, then start as host when
            you are ready to test camera, mic, chat, and screen sharing.
          </p>

          <div className="mt-8 grid gap-3">
            {[
              "Host starts the room first",
              "Participants join using the meeting link",
              "Mediasoup camera, mic, chat, and screen sharing ready",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-border bg-navy-50 p-4 transition-all duration-200 hover:border-telefya-blue/30"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,rgba(15,107,255,0.12),rgba(100,38,255,0.1))] text-telefya-blue ring-1 ring-border">
                  <MonitorUp size={17} />
                </span>
                <span className="text-sm font-bold text-navy-700">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-navy-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
              Generated room link
            </p>
            <p className="mt-2 break-all text-sm font-bold text-navy-700">
              {meetingPath}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-8 shadow-soft transition-shadow duration-200 hover:shadow-enterprise">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-navy-300">
                New meeting
              </p>
              <h2 className="mt-2 text-2xl font-black text-navy-900">
                Schedule details
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
                This saves directly to your backend meeting schedule endpoint.
              </p>
            </div>

            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,rgba(15,107,255,0.12),rgba(100,38,255,0.1))] text-telefya-blue">
              <CalendarClock size={20} />
            </span>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-black text-navy-900">
                Meeting title
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-navy-900 outline-none transition-all duration-200 focus:border-telefya-blue focus:ring-2 focus:ring-telefya-blue/15"
                required
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-black text-navy-900">
                  Date and time
                </span>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-navy-900 outline-none transition-all duration-200 focus:border-telefya-blue focus:ring-2 focus:ring-telefya-blue/15"
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-navy-900">
                  Time zone
                </span>
                <input
                  value={timeZone}
                  onChange={(event) => setTimeZone(event.target.value)}
                  className="h-12 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-navy-900 outline-none transition-all duration-200 focus:border-telefya-blue focus:ring-2 focus:ring-telefya-blue/15"
                  required
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-black text-navy-900">Room ID</span>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value)}
                  className="h-12 min-w-0 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-navy-900 outline-none transition-all duration-200 focus:border-telefya-blue focus:ring-2 focus:ring-telefya-blue/15"
                  required
                />
                <button
                  type="button"
                  onClick={() => setRoomId(createRoomId())}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-700 transition-all duration-200 hover:border-telefya-blue hover:text-telefya-blue"
                >
                  Regenerate
                </button>
              </div>
            </label>

            <div className="rounded-xl border border-border bg-navy-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-navy-300">
                Meeting link
              </p>
              <p className="mt-2 break-all text-sm font-bold text-navy-700">
                {meetingPath}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-5 font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet hover:shadow-enterprise disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Scheduling..." : "Schedule meeting"}
            </button>
          </form>

          {createdLink ? (
            <div className="mt-6 rounded-xl border border-telefya-green/30 bg-telefya-green/10 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-telefya-green" />
                <p className="font-black text-navy-900">Meeting created</p>
              </div>

              <p className="mt-2 break-all text-sm font-semibold text-navy-600">
                {createdLink}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={copyLink}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-900 transition-all duration-200 hover:border-telefya-green hover:text-telefya-green"
                >
                  {copied ? <CheckCircle2 size={17} /> : <Copy size={17} />}
                  {copied ? "Copied" : "Copy link"}
                </button>

                <Link
                  href={createdLink.replace(
                    typeof window !== "undefined" ? window.location.origin : "",
                    ""
                  )}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-black text-white transition-all duration-200 hover:bg-telefya-violet"
                >
                  <Video size={17} />
                  Start room
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <section className="mt-6 grid gap-5 md:grid-cols-3">
        <article className="rounded-xl border border-border bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-enterprise">
          <ShieldCheck size={22} className="text-telefya-green" />
          <h3 className="mt-4 font-black text-navy-900">Authenticated</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
            The backend attaches this schedule to the signed-in user.
          </p>
        </article>

        <article className="rounded-xl border border-border bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-enterprise">
          <MonitorUp size={22} className="text-telefya-violet" />
          <h3 className="mt-4 font-black text-navy-900">Live ready</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
            The generated room opens through the live mediasoup page.
          </p>
        </article>

        <article className="rounded-xl border border-border bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-enterprise">
          <CalendarClock size={22} className="text-telefya-blue" />
          <h3 className="mt-4 font-black text-navy-900">Lobby synced</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
            The new meeting appears in lobby, host, speaker, and attendee views.
          </p>
        </article>
      </section>
    </main>
  );
}