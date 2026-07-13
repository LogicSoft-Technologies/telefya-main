"use client";

import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Clock3,
  Database,
  Download,
  FileText,
  HardDrive,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getReportSummary,
  listAttendanceReports,
  type AttendanceReport,
  type ReportSummary,
} from "@/lib/api/reports";
import { getMeetings } from "@/lib/api/meetings";
import {
  deleteRecording,
  listRecordings,
  saveRecordingToDevice,
  type MeetingRecording,
} from "@/lib/api/recordings";

const emptySummary: ReportSummary = {
  total_meetings: 0,
  total_attendees: 0,
  total_minutes: 0,
  recordings: 0,
};

function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat().format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatMinutes(value?: number) {
  if (!value) return "0m";

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (!hours) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function formatBytes(value?: number) {
  if (!value) return "0 KB";

  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function downloadCsv(rows: AttendanceReport[]) {
  const headers = [
    "Meeting",
    "Attendee",
    "Email",
    "Joined At",
    "Left At",
    "Duration Minutes",
  ];

  const body = rows.map((row) => [
    row.meeting_title || "",
    row.attendee_name || "",
    row.attendee_email || "",
    row.joined_at || "",
    row.left_at || "",
    row.duration_minutes || 0,
  ]);

  const csv = [headers, ...body]
    .map((line) =>
      line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `telefya-attendance-${Date.now()}.csv`;
  anchor.click();

  URL.revokeObjectURL(url);
}

function StatCard({
  title,
  value,
  caption,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <article className="enterprise-card overflow-hidden rounded-2xl">
      <div className="telefya-accent-line h-1" />
      <div className="p-5">
        <div
          className={["grid h-12 w-12 place-items-center rounded-2xl", tone].join(
            " ",
          )}
        >
          <Icon size={22} />
        </div>

        <p className="mt-6 text-3xl font-black text-navy-900">{value}</p>
        <h3 className="mt-1 text-sm font-black text-navy-900">{title}</h3>
        <p className="mt-1 text-sm font-semibold text-navy-400">{caption}</p>
      </div>
    </article>
  );
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [recordings, setRecordings] = useState<MeetingRecording[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [recordingActionId, setRecordingActionId] = useState("");

  async function loadAnalytics() {
    setLoading(true);
    setNotice("");

    const [summaryResult, reportsResult, recordingsResult] =
      await Promise.allSettled([
        getReportSummary(),
        listAttendanceReports(),
        listRecordings(),
      ]);

    if (summaryResult.status === "fulfilled") {
      setSummary(summaryResult.value.data || emptySummary);
    } else {
      try {
        const meetings = await getMeetings();

        setSummary({
          ...emptySummary,
          total_meetings: meetings.length,
        });

        setNotice("Showing available meeting data while analytics sync finishes.");
      } catch {
        setSummary(emptySummary);
        setNotice(
          summaryResult.reason instanceof Error
            ? summaryResult.reason.message
            : "Unable to load analytics summary.",
        );
      }
    }

    if (reportsResult.status === "fulfilled") {
      setReports(reportsResult.value.data || []);
    } else {
      setReports([]);
      setNotice((current) => current || "Unable to load attendance reports.");
    }

    if (recordingsResult.status === "fulfilled") {
      const data = recordingsResult.value.data || [];
      setRecordings(data);

      setSummary((current) => ({
        ...current,
        recordings: data.length || current.recordings || 0,
      }));
    } else {
      setRecordings([]);
      setNotice((current) => current || "Unable to load meeting recordings.");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const filteredReports = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return reports;

    return reports.filter((report) => {
      return [report.meeting_title, report.attendee_name, report.attendee_email]
        .filter(Boolean)
        .some((item) => item?.toLowerCase().includes(value));
    });
  }, [query, reports]);

  const filteredRecordings = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return recordings;

    return recordings.filter((recording) => {
      return [
        recording.title,
        recording.file_name,
        recording.room_id,
        recording.recording_id,
        recording.status,
      ]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(value));
    });
  }, [query, recordings]);

  const engagementRate = useMemo(() => {
    if (!summary.total_meetings) return 0;
    return Math.round(summary.total_attendees / summary.total_meetings);
  }, [summary.total_attendees, summary.total_meetings]);

  async function downloadSavedRecording(recordingId: string) {
    setRecordingActionId(recordingId);

    try {
      await saveRecordingToDevice(recordingId);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Unable to download recording.",
      );
    } finally {
      setRecordingActionId("");
    }
  }

  async function removeSavedRecording(recordingId: string) {
    const ok = window.confirm("Delete this recording?");
    if (!ok) return;

    setRecordingActionId(recordingId);

    try {
      await deleteRecording(recordingId);
      await loadAnalytics();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to delete recording.");
    } finally {
      setRecordingActionId("");
    }
  }

  return (
    <div className="grid gap-6">
      <section className="telefya-surface overflow-hidden rounded-3xl border border-border shadow-enterprise">
        <div className="telefya-accent-line h-1.5" />

        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_auto] xl:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-navy-300">
              Workspace Analytics
            </p>

            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-navy-900">
              Meeting performance, attendance, and recordings.
            </h1>

            <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-navy-500">
              Track scheduled meetings, participant activity, saved recordings,
              and attendance history from one reporting view.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadAnalytics}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-800 shadow-soft transition hover:border-telefya-blue hover:text-telefya-blue"
            >
              <RefreshCcw size={17} />
              Refresh
            </button>

            <button
              onClick={() => downloadCsv(filteredReports)}
              disabled={filteredReports.length === 0}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white shadow-soft transition hover:bg-telefya-violet disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Download size={17} />
              Export CSV
            </button>
          </div>
        </div>
      </section>

      {notice ? (
        <div className="flex items-start gap-3 rounded-2xl border border-telefya-gold/30 bg-telefya-gold/10 px-4 py-3 text-sm font-bold text-navy-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-telefya-gold" />
          <span>{notice}</span>
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total meetings"
          value={formatNumber(summary.total_meetings)}
          caption="Scheduled and hosted rooms"
          icon={CalendarDays}
          tone="bg-telefya-blue/10 text-telefya-blue"
        />

        <StatCard
          title="Total attendees"
          value={formatNumber(summary.total_attendees)}
          caption="Participants tracked"
          icon={Users}
          tone="bg-telefya-green/10 text-telefya-green"
        />

        <StatCard
          title="Meeting minutes"
          value={formatMinutes(summary.total_minutes)}
          caption="Total session duration"
          icon={Clock3}
          tone="bg-telefya-violet/10 text-telefya-violet"
        />

        <StatCard
          title="Recordings"
          value={formatNumber(recordings.length || summary.recordings)}
          caption="Saved meeting assets"
          icon={Video}
          tone="bg-telefya-coral/10 text-telefya-coral"
        />
      </section>

      <section className="enterprise-card rounded-3xl">
        <div className="flex flex-col justify-between gap-4 border-b border-border p-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-black text-navy-900">
              Meeting recordings
            </h2>
            <p className="mt-1 text-sm font-semibold text-navy-500">
              Download host recordings saved after live meetings.
            </p>
          </div>

          <div className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-border bg-navy-50 px-3 md:w-[340px]">
            <Search size={17} className="shrink-0 text-navy-300" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reports and recordings..."
              className="w-full bg-transparent text-sm font-semibold text-navy-700 outline-none placeholder:text-navy-300"
            />
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl bg-navy-50 px-4 py-5 text-sm font-black text-navy-600">
              <Loader2 size={18} className="animate-spin text-telefya-blue" />
              Loading recordings...
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-border bg-navy-50 p-8 text-center">
              <div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-soft">
                  <Video size={22} className="text-telefya-violet" />
                </div>

                <h3 className="mt-5 text-lg font-black text-navy-900">
                  No recordings saved yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-navy-500">
                  Start a host recording in a live room, stop it, then refresh
                  this page to download the saved file.
                </p>

                <Link
                  href="/lobby"
                  className="mt-5 inline-flex h-11 items-center rounded-xl bg-telefya-blue px-4 text-sm font-black text-white hover:bg-telefya-violet"
                >
                  Go to lobby
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRecordings.map((recording) => {
                const recordingId =
                  recording.recording_id || String(recording.id || "");
                const busy = recordingActionId === recordingId;
                const ready = recording.status === "ready";

                return (
                  <article
                    key={recordingId}
                    className="grid gap-4 rounded-2xl border border-border bg-white p-4 shadow-soft transition hover:border-telefya-blue/40 lg:grid-cols-[1fr_auto] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-navy-900">
                          {recording.title ||
                            recording.file_name ||
                            "Telefya recording"}
                        </h3>

                        <span
                          className={[
                            "rounded-full px-3 py-1 text-xs font-black",
                            ready
                              ? "bg-emerald-50 text-telefya-green"
                              : recording.status === "failed"
                                ? "bg-red-50 text-red-600"
                                : "bg-blue-50 text-telefya-blue",
                          ].join(" ")}
                        >
                          {recording.status}
                        </span>
                      </div>

                      <p className="mt-2 break-all text-xs font-bold text-navy-400">
                        Room: {recording.room_id}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                        <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-3 py-1 text-navy-500">
                          <HardDrive size={13} />
                          {formatBytes(recording.size_bytes)}
                        </span>

                        <span className="rounded-full bg-navy-50 px-3 py-1 text-navy-500">
                          Started {formatDate(recording.started_at)}
                        </span>

                        {recording.stopped_at ? (
                          <span className="rounded-full bg-navy-50 px-3 py-1 text-navy-500">
                            Stopped {formatDate(recording.stopped_at)}
                          </span>
                        ) : null}

                        {recording.expires_at ? (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-telefya-gold">
                            Expires {formatDate(recording.expires_at)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => downloadSavedRecording(recordingId)}
                        disabled={!ready || busy}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white hover:bg-telefya-violet disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Download size={16} />
                        )}
                        Download
                      </button>

                      <button
                        onClick={() => removeSavedRecording(recordingId)}
                        disabled={busy}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-black text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={16} />
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

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <article className="enterprise-card rounded-3xl">
          <div className="flex flex-col justify-between gap-4 border-b border-border p-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-black text-navy-900">
                Attendance reports
              </h2>
              <p className="mt-1 text-sm font-semibold text-navy-500">
                Search participant sessions and export reports.
              </p>
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl bg-navy-50 px-4 py-5 text-sm font-black text-navy-600">
                <Loader2 size={18} className="animate-spin text-telefya-blue" />
                Loading analytics...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-border bg-navy-50 p-8 text-center">
                <div>
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-soft">
                    <Database size={22} className="text-telefya-violet" />
                  </div>

                  <h3 className="mt-5 text-lg font-black text-navy-900">
                    No attendance records yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-navy-500">
                    Join and leave a live meeting to create attendance history.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border">
                <table className="w-full min-w-[760px] border-collapse bg-white text-left">
                  <thead className="bg-navy-50 text-xs font-black uppercase tracking-[0.12em] text-navy-400">
                    <tr>
                      <th className="px-4 py-3">Meeting</th>
                      <th className="px-4 py-3">Attendee</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3">Left</th>
                      <th className="px-4 py-3">Duration</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-navy-50/70">
                        <td className="px-4 py-4">
                          <p className="font-black text-navy-900">
                            {report.meeting_title || "Telefya meeting"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-bold text-navy-800">
                            {report.attendee_name || "Unknown attendee"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-navy-400">
                            {report.attendee_email || "No email"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-navy-600">
                          {formatDate(report.joined_at)}
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-navy-600">
                          {formatDate(report.left_at)}
                        </td>

                        <td className="px-4 py-4 text-sm font-black text-navy-900">
                          {formatMinutes(report.duration_minutes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </article>

        <aside className="grid gap-5">
          <article className="enterprise-card rounded-3xl p-5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-telefya-purple/10 text-telefya-purple">
              <BarChart3 size={22} />
            </div>

            <h2 className="mt-5 text-xl font-black text-navy-900">
              Engagement score
            </h2>

            <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
              Average attendees per scheduled meeting.
            </p>

            <div className="mt-6 rounded-2xl bg-navy-50 p-5">
              <p className="text-4xl font-black text-navy-900">
                {formatNumber(engagementRate)}
              </p>
              <p className="mt-1 text-sm font-bold text-navy-500">
                attendees / meeting
              </p>
            </div>
          </article>

          <article className="enterprise-card rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-telefya-green/10 text-telefya-green">
                <ShieldCheck size={21} />
              </div>

              <div>
                <h2 className="font-black text-navy-900">Secure reporting</h2>
                <p className="text-sm font-semibold text-navy-400">
                  Authenticated workspace data
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm font-semibold text-navy-600">
              <div className="flex items-center justify-between rounded-xl bg-navy-50 px-4 py-3">
                <span>Meeting source</span>
                <strong className="text-navy-900">Backend</strong>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-navy-50 px-4 py-3">
                <span>Attendance</span>
                <strong className="text-navy-900">
                  {reports.length ? "Live" : "Waiting"}
                </strong>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-navy-50 px-4 py-3">
                <span>Recordings</span>
                <strong className="text-navy-900">
                  {recordings.length ? "Live" : "Waiting"}
                </strong>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-navy-50 px-4 py-3">
                <span>Exports</span>
                <strong className="text-navy-900">CSV / Video</strong>
              </div>
            </div>
          </article>

          <article className="rounded-3xl bg-navy-900 p-5 text-white shadow-enterprise">
            <FileText size={22} className="text-telefya-gold" />

            <h2 className="mt-5 text-xl font-black">Retention policy</h2>

            <p className="mt-2 text-sm font-semibold leading-6 text-white/60">
              Recordings are available for download until their retention date,
              then backend cleanup can remove expired files.
            </p>
          </article>
        </aside>
      </section>
    </div>
  );
}