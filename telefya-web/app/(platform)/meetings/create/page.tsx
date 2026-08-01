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

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatLocalDateTimeInput(date: Date) {
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}

function getLocalDateTimeValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 5);
  date.setSeconds(0, 0);
  return formatLocalDateTimeInput(date);
}

function parseLocalDateTime(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hours, minutes] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    0,
    0,
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

export default function CreateMeetingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("Telefya meeting");
  const [date, setDate] = useState(getLocalDateTimeValue());
  const [timeZone, setTimeZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
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
      const selectedDate = parseLocalDateTime(date);
      const minimumDate = new Date(Date.now() + 60_000);

      if (!selectedDate || selectedDate < minimumDate) {
        setDate(getLocalDateTimeValue());
        throw new Error("Choose a meeting time at least one minute from now.");
      }

      await scheduleMeeting({
        date: selectedDate.toISOString(),
        timeZone,
        path: meetingPath,
        des: title.trim() || "Telefya meeting",
      });

      setCreatedLink(meetingPath);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to schedule meeting.",
      );
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
    <main className="mx-auto max-w-6xl pb-4">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/lobby"
          className="inline-flex items-center gap-2 text-sm font-black text-navy-500 transition-all duration-200 hover:text-telefya-blue"
        >
          <ArrowLeft size={17} />
          Back to lobby
        </Link>

        <button
          onClick={() => router.refresh()}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-700 transition-all duration-200 hover:border-telefya-blue hover:text-telefya-blue sm:w-auto"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-2 lg:items-start">
        <section className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-soft transition-shadow duration-200 hover:shadow-enterprise sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(15,107,255,0.14),transparent_70%)]" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(100,38,255,0.1),transparent_70%)]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-telefya-blue ring-1 ring-telefya-blue/10">
              <Sparkles size={15} />
              Meeting setup
            </div>

            <h1 className="mt-5 text-[clamp(1.9rem,8vw,2.35rem)] font-black leading-tight tracking-tight text-navy-900 sm:mt-6">
              Create a secure Telefya meeting
            </h1>

            <p className="mt-4 max-w-md leading-7 text-navy-500">
              Schedule a room, generate a shareable link, then start as host
              when you are ready to test camera, mic, chat, and screen
              sharing.
            </p>

            <div className="mt-6 grid gap-3 sm:mt-8">
              {[
                {
                  icon: MonitorUp,
                  label: "Host starts the room first",
                },
                {
                  icon: Video,
                  label: "Participants join using the meeting link",
                },
                {
                  icon: ShieldCheck,
                  label: "Mediasoup camera, mic, chat, and screen sharing ready",
                },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-navy-50/70 p-3 transition-all duration-200 hover:border-telefya-blue/30 hover:bg-white sm:p-4"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,rgba(15,107,255,0.14),rgba(100,38,255,0.12))] text-telefya-blue ring-1 ring-border">
                    <Icon size={17} />
                  </span>
                  <span className="text-sm font-bold leading-6 text-navy-700">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-border bg-navy-50/70 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
                Generated room link
              </p>
              <p className="mt-2 break-all font-mono text-sm font-bold leading-6 text-navy-700">
                {meetingPath}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-soft transition-shadow duration-200 hover:shadow-enterprise sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-navy-300">
                New meeting
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-navy-900">
                Schedule details
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
                This saves directly to your backend meeting schedule endpoint.
              </p>
            </div>

            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,rgba(15,107,255,0.14),rgba(100,38,255,0.12))] text-telefya-blue ring-1 ring-border">
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

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-black text-navy-900">
                  Date and time
                </span>
                <input
                  type="datetime-local"
                  value={date}
                  min={formatLocalDateTimeInput(new Date())}
                  onChange={(event) => setDate(event.target.value)}
                  className="h-12 min-w-0 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-navy-900 outline-none transition-all duration-200 focus:border-telefya-blue focus:ring-2 focus:ring-telefya-blue/15 sm:px-4"
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
                  className="h-12 min-w-0 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-navy-900 outline-none transition-all duration-200 focus:border-telefya-blue focus:ring-2 focus:ring-telefya-blue/15 sm:px-4"
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

            <div className="rounded-xl border border-border bg-navy-50/70 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-navy-300">
                Meeting link
              </p>
              <p className="mt-2 break-all font-mono text-sm font-bold leading-6 text-navy-700">
                {meetingPath}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-5 font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet hover:shadow-enterprise active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Scheduling..." : "Schedule meeting"}
            </button>
          </form>

          {createdLink ? (
            <div className="mt-6 rounded-xl border border-telefya-green/30 bg-telefya-green/10 p-4 transition-all duration-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-telefya-green" />
                <p className="font-black text-navy-900">Meeting created</p>
              </div>

              <p className="mt-2 break-all font-mono text-sm font-semibold leading-6 text-navy-600">
                {createdLink}
              </p>

              <div className="mt-4 grid gap-3 sm:flex">
                <button
                  onClick={copyLink}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-900 transition-all duration-200 hover:border-telefya-green hover:text-telefya-green"
                >
                  {copied ? <CheckCircle2 size={17} /> : <Copy size={17} />}
                  {copied ? "Copied" : "Copy link"}
                </button>

                <Link
                  href={createdLink.replace(
                    typeof window !== "undefined" ? window.location.origin : "",
                    "",
                  )}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-black text-white transition-all duration-200 hover:bg-telefya-violet"
                >
                  <Video size={17} />
                  Start room
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <section className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-border bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-enterprise">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-telefya-green/10">
            <ShieldCheck size={20} className="text-telefya-green" />
          </span>
          <h3 className="mt-4 font-black text-navy-900">Authenticated</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
            The backend attaches this schedule to the signed-in user.
          </p>
        </article>

        <article className="rounded-2xl border border-border bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-enterprise">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-telefya-violet/10">
            <MonitorUp size={20} className="text-telefya-violet" />
          </span>
          <h3 className="mt-4 font-black text-navy-900">Live ready</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
            The generated room opens through the live mediasoup page.
          </p>
        </article>

        <article className="rounded-2xl border border-border bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-enterprise">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-telefya-blue/10">
            <CalendarClock size={20} className="text-telefya-blue" />
          </span>
          <h3 className="mt-4 font-black text-navy-900">Lobby synced</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
            The new meeting appears in lobby, host, speaker, and attendee views.
          </p>
        </article>
      </section>
    </main>
  );
}