"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Video,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  deleteMeetings,
  getMeetings,
  type ScheduledMeeting,
} from "@/lib/api/meetings";
import {
  getBillingUsage,
  getCurrentSubscription,
  type BillingSubscription,
  type BillingUsage,
} from "@/lib/api/billing";
import { getSavedUser } from "@/lib/auth/session";
import { getAccessToken } from "@/lib/auth/tokens";

function decodeStoredText(value?: string) {
  if (!value) return "";

  if (typeof window === "undefined") {
    return value
      .replace(/&#x2F;/g, "/")
      .replace(/&amp;/g, "&")
      .replace(/&colon;/g, ":");
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function getRoomPath(meetingUrl?: string) {
  const decodedUrl = decodeStoredText(meetingUrl);

  try {
    const url = new URL(decodedUrl);
    return url.pathname;
  } catch {
    return decodedUrl.startsWith("/live") ? decodedUrl : "/live/test-room-1";
  }
}

function getMeetingDateLabel(timeZone?: string) {
  if (!timeZone) return "No schedule time";

  const decoded = decodeStoredText(timeZone);
  const [datePart, ...zoneParts] = decoded.split(" ");
  const zone = zoneParts.join(" ");
  const date = new Date(datePart);

  if (Number.isNaN(date.getTime())) return decoded;

  return `${date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  })}${zone ? ` ${zone}` : ""}`;
}

function formatBytes(bytes?: number) {
  const value = Number(bytes || 0);

  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;

  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default function ConferenceLobbyPage() {
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [usage, setUsage] = useState<BillingUsage | null>(null);

  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const [error, setError] = useState("");

  const user = getSavedUser();

  const displayName = useMemo(() => {
    return (
      [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
      user?.email ||
      "Telefya user"
    );
  }, [user]);

  const firstName = displayName.split(" ")[0] || "there";
  const limits = subscription?.limits;
  const isFree = subscription?.plan_code === "free";

  async function loadMeetings(isRefresh = false) {
    setError("");
    isRefresh ? setRefreshing(true) : setLoading(true);

    try {
      const data = await getMeetings();
      setMeetings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load meetings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadBilling() {
    setBillingLoading(true);

    try {
      const token = getAccessToken();

      if (!token) {
        setBillingLoading(false);
        return;
      }

      const [subscriptionResponse, usageResponse] = await Promise.all([
        getCurrentSubscription(token),
        getBillingUsage(token),
      ]);

      setSubscription(subscriptionResponse.data || null);
      setUsage(usageResponse.data || null);
    } catch {
      setSubscription(null);
      setUsage(null);
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleCopy(meeting: ScheduledMeeting) {
    const decodedUrl = decodeStoredText(meeting.meeting_url);

    try {
      await navigator.clipboard.writeText(decodedUrl);
      setCopiedId(meeting.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setError("Unable to copy the meeting link.");
    }
  }

  async function handleDelete(meetingId: number | string) {
    setError("");
    setDeletingId(meetingId);

    try {
      await deleteMeetings([meetingId]);
      setMeetings((current) =>
        current.filter((meeting) => meeting.id !== meetingId),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete meeting.");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    loadMeetings();
    loadBilling();
  }, []);

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-enterprise">
        <div className="telefya-accent-line h-1" />

        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_380px] xl:items-stretch">
          <div className="flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-navy-500 shadow-soft">
                <Sparkles size={15} className="text-telefya-violet" />
                Conference lobby
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-navy-900 lg:text-4xl">
                Welcome back,{" "}
                <span className="telefya-text-gradient">{firstName}</span>
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-8 text-navy-500">
                Start secure meetings, manage invites, and keep your workspace
                inside your current Telefya plan.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  loadMeetings(true);
                  loadBilling();
                }}
                disabled={refreshing}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-black text-navy-900 shadow-soft transition hover:border-telefya-blue hover:text-telefya-blue disabled:cursor-not-allowed disabled:opacity-70"
              >
                {refreshing ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <RefreshCcw size={17} />
                )}
                Refresh
              </button>

              <Link
                href="/meetings/create"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-telefya-blue px-5 text-sm font-black text-white shadow-soft transition hover:bg-telefya-violet"
              >
                <Plus size={17} />
                Create meeting
              </Link>

              <Link
                href="/billing"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-black text-navy-900 shadow-soft transition hover:border-telefya-violet hover:text-telefya-violet"
              >
                <Zap size={17} />
                Billing
              </Link>
            </div>
          </div>

          <aside className="rounded-xl border border-border bg-navy-50 p-4">
            <div className="flex items-start justify-between gap-4 rounded-xl bg-white p-4 shadow-soft">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-400">
                  Current plan
                </p>

                <p className="mt-2 text-2xl font-black text-navy-900">
                  {billingLoading
                    ? "Loading"
                    : subscription?.plan_name || "Free"}
                </p>

                <p className="mt-1 text-sm font-bold text-navy-500">
                  {limits
                    ? `${limits.max_participants} participants • ${limits.max_meeting_minutes} min meetings`
                    : "Plan limits loading"}
                </p>
              </div>

              <span
                className={[
                  "rounded-full px-3 py-1 text-xs font-black",
                  isFree
                    ? "bg-blue-50 text-telefya-blue"
                    : "bg-emerald-50 text-telefya-green",
                ].join(" ")}
              >
                {subscription?.status || "free"}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <PlanMetric
                label="Record"
                value={limits?.recording_enabled ? "On" : "Off"}
                tone={limits?.recording_enabled ? "green" : "muted"}
              />
              <PlanMetric
                label="Used"
                value={`${usage?.meeting_minutes_used || 0}m`}
              />
              <PlanMetric
                label="Storage"
                value={formatBytes(usage?.storage_bytes_used)}
              />
            </div>

            {isFree ? (
              <Link
                href="/choose-plan?plan=pro"
                className="mt-4 flex h-11 items-center justify-center rounded-xl bg-telefya-violet px-4 text-sm font-black text-white shadow-soft transition hover:bg-telefya-purple"
              >
                Upgrade for recording
              </Link>
            ) : (
              <Link
                href="/billing"
                className="mt-4 flex h-11 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-900 transition hover:border-telefya-blue hover:text-telefya-blue"
              >
                Manage plan
              </Link>
            )}
          </aside>
        </div>
      </section>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          <XCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-3">
        <SummaryCard
          icon={CalendarDays}
          label="Scheduled meetings"
          value={String(meetings.length)}
          tone="blue"
        />
        <SummaryCard
          icon={Video}
          label="Recording"
          value={limits?.recording_enabled ? "Enabled" : "Plan gated"}
          tone="violet"
        />
        <SummaryCard
          icon={Users}
          label="Participant limit"
          value={limits ? String(limits.max_participants) : "4"}
          tone="green"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-soft">
        <div className="flex flex-col justify-between gap-4 border-b border-border bg-white px-5 py-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-black text-navy-900">Your meetings</h2>
            <p className="mt-1 text-sm font-semibold text-navy-500">
              Start as host, copy invite links, or clean up old sessions.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-navy-50 px-4 py-2 text-xs font-black text-navy-500">
            <CheckCircle2 size={15} className="text-telefya-green" />
            Synced with backend
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-3 rounded-xl bg-navy-50 px-4 py-6 font-bold text-navy-500">
              <Loader2 size={18} className="animate-spin text-telefya-blue" />
              Loading meetings...
            </div>
          ) : meetings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-navy-50 p-8 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-white text-telefya-violet shadow-soft">
                <Video size={24} />
              </div>
              <p className="mt-4 font-black text-navy-900">No meetings yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-navy-500">
                Create your first Telefya meeting and start testing camera, mic,
                chat, recording, and participant controls.
              </p>
              <Link
                href="/meetings/create"
                className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-telefya-blue px-5 text-sm font-black text-white shadow-soft transition hover:bg-telefya-violet"
              >
                <Plus size={17} />
                Create meeting
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {meetings.map((meeting) => {
                const decodedUrl = decodeStoredText(meeting.meeting_url);
                const roomPath = getRoomPath(meeting.meeting_url);
                const meetingLabel = meeting.des || "Telefya meeting";
                const isDeleting = deletingId === meeting.id;
                const isCopied = copiedId === meeting.id;

                return (
                  <article
                    key={meeting.id}
                    className="group grid gap-4 rounded-xl border border-border bg-white p-4 shadow-soft transition hover:border-telefya-blue/40 hover:shadow-enterprise xl:grid-cols-[1fr_auto] xl:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-navy-900">
                          {meetingLabel}
                        </h3>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-telefya-blue">
                          Room ready
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-navy-500">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 size={16} className="text-telefya-violet" />
                          {getMeetingDateLabel(meeting.time_zone)}
                        </span>
                      </div>

                      <p className="mt-3 break-all rounded-lg bg-navy-50 px-3 py-2 text-xs font-bold text-navy-400">
                        {decodedUrl}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <Link
                        href={roomPath}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white shadow-soft transition hover:bg-telefya-violet"
                      >
                        <Video size={16} />
                        Start room
                      </Link>

                      <button
                        onClick={() => handleCopy(meeting)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-700 transition hover:border-telefya-green hover:text-telefya-green"
                      >
                        {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                        {isCopied ? "Copied" : "Copy link"}
                      </button>

                      <button
                        onClick={() => handleDelete(meeting.id)}
                        disabled={isDeleting}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isDeleting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function PlanMetric({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: string;
  tone?: "blue" | "green" | "muted";
}) {
  const tones = {
    blue: "text-telefya-blue",
    green: "text-telefya-green",
    muted: "text-navy-400",
  };

  return (
    <div className="rounded-xl bg-white p-3 shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-navy-400">
        {label}
      </p>
      <p className={`mt-2 text-lg font-black ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  tone: "blue" | "violet" | "green";
}) {
  const tones = {
    blue: "bg-blue-50 text-telefya-blue",
    violet: "bg-violet-50 text-telefya-violet",
    green: "bg-emerald-50 text-telefya-green",
  };

  return (
    <article className="telefya-surface rounded-xl p-5 transition hover:-translate-y-0.5 hover:shadow-enterprise">
      <div className={`grid h-12 w-12 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon size={22} />
      </div>
      <p className="mt-5 text-3xl font-black text-navy-900">{value}</p>
      <p className="mt-1 text-sm font-bold text-navy-500">{label}</p>
    </article>
  );
}