"use client";

import Link from "next/link";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Network,
  RefreshCcw,
  UserRound,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getMeetings, type ScheduledMeeting } from "@/lib/api/meetings";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  generateCertificate,
  listAttendeeNetworking,
  listCertificates,
  type AttendeeCertificate,
  type AttendeeNetworkUser,
} from "@/lib/api/workspace";

function decodeStoredText(value?: string) {
  if (!value) return "";
  if (typeof window === "undefined") {
    return value.replace(/&#x2F;/g, "/").replace(/&amp;/g, "&").replace(/&colon;/g, ":");
  }
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function getRoomPath(meetingUrl?: string) {
  const decodedUrl = decodeStoredText(meetingUrl);
  try {
    return new URL(decodedUrl).pathname;
  } catch {
    return decodedUrl.startsWith("/live") ? decodedUrl : "/live/test-room-1";
  }
}

function getMeetingDateLabel(timeZone?: string) {
  if (!timeZone) return "No scheduled time";
  const decoded = decodeStoredText(timeZone);
  const [datePart, ...zoneParts] = decoded.split(" ");
  const zone = zoneParts.join(" ");
  const date = new Date(datePart);
  if (Number.isNaN(date.getTime())) return decoded;
  return `${date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}${zone ? ` ${zone}` : ""}`;
}

function displayName(user: AttendeeNetworkUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
}

export default function AttendeePage() {
  const { profile, loading: profileLoading, error: profileError, reload } = useCurrentUser();

  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
  const [networking, setNetworking] = useState<AttendeeNetworkUser[]>([]);
  const [certificates, setCertificates] = useState<AttendeeCertificate[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");

  const currentUserName = useMemo(
    () => [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Attendee",
    [profile]
  );

  async function loadPage() {
    setLoadingPage(true);
    setPageError("");
    try {
      const [meetingData, networkingResponse, certificatesResponse] = await Promise.all([
        getMeetings(),
        listAttendeeNetworking(),
        listCertificates(),
      ]);

      setMeetings(meetingData);
      setNetworking(networkingResponse.data || []);
      setCertificates(certificatesResponse.data || []);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Unable to load attendee workspace.");
    } finally {
      setLoadingPage(false);
    }
  }

  async function handleGenerateCertificate(meeting?: ScheduledMeeting) {
    setPageError("");
    setMessage("");

    try {
      await generateCertificate({
        meeting_id: meeting?.id,
        title: meeting?.des ? `${meeting.des} Certificate` : "Telefya Attendance Certificate",
      });

      const response = await listCertificates();
      setCertificates(response.data || []);
      setMessage("Certificate generated successfully.");
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Unable to generate certificate.");
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  const attendeeTools = [
    { title: "Agenda", icon: CalendarDays, desc: `${meetings.length} scheduled meeting${meetings.length === 1 ? "" : "s"}.`, status: "Live" },
    { title: "Chat", icon: MessageSquare, desc: "Available inside every live meeting room.", status: "Live" },
    { title: "Profile", icon: UserRound, desc: "Synced from your authenticated user profile.", status: "Live" },
    { title: "Networking", icon: Network, desc: `${networking.length} attendee connection${networking.length === 1 ? "" : "s"} available.`, status: "Live" },
    { title: "Certificates", icon: Award, desc: `${certificates.length} certificate${certificates.length === 1 ? "" : "s"} saved.`, status: "Live" },
  ];

  return (
    <div className="grid gap-6">
      <section className="telefya-aurora overflow-hidden rounded-xl border border-border bg-white shadow-enterprise">
        <div className="telefya-accent-line h-1" />
        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_340px] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-navy-500 shadow-soft">
              <UserRound size={15} className="text-telefya-violet" />
              Attendee portal
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-navy-900 lg:text-4xl">
              Your meeting workspace, <span className="telefya-text-gradient">{currentUserName}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-navy-500">
              Join rooms, meet attendees, and generate attendance certificates from backend-backed workspace data.
            </p>
          </div>

          <div className="rounded-xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">Attendee status</p>
            <div className="mt-4 grid gap-3">
              <StatusRow label="Profile" value={profile ? "Synced" : "Loading"} />
              <StatusRow label="Meetings" value={`${meetings.length} scheduled`} />
              <StatusRow label="Certificates" value={`${certificates.length} saved`} />
            </div>
          </div>
        </div>
      </section>

      {(profileError || pageError || message) ? (
        <div
          className={[
            "rounded-xl border p-4 text-sm font-bold",
            message && !profileError && !pageError
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          {profileError || pageError || message}
          {(profileError || pageError) ? (
            <button
              onClick={() => {
                reload();
                loadPage();
              }}
              className="ml-3 inline-flex items-center gap-2 underline"
            >
              <RefreshCcw size={15} />
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {attendeeTools.map((item) => (
          <FeatureCard key={item.title} {...item} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-xl border border-border bg-white shadow-soft">
          <div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-black text-navy-900">Your meeting agenda</h2>
              <p className="mt-1 text-sm font-semibold text-navy-500">Pulled from your scheduled meetings endpoint.</p>
            </div>
            <button onClick={loadPage} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-700 hover:border-telefya-blue hover:text-telefya-blue">
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>

          <div className="p-5">
            {loadingPage ? (
              <LoadingRow label="Loading agenda..." />
            ) : meetings.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No attendee sessions yet" text="Create or receive a meeting link, then it will show here." />
            ) : (
              <div className="grid gap-4">
                {meetings.map((meeting) => (
                  <article key={meeting.id} className="grid gap-4 rounded-xl border border-border bg-white p-4 shadow-soft transition hover:border-telefya-blue/40 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <h3 className="font-black text-navy-900">{meeting.des || "Telefya meeting"}</h3>
                      <p className="mt-2 text-sm font-semibold text-navy-500">{getMeetingDateLabel(meeting.time_zone)}</p>
                      <p className="mt-2 break-all text-xs font-bold text-navy-300">{decodeStoredText(meeting.meeting_url)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleGenerateCertificate(meeting)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-black text-navy-700 hover:border-telefya-green hover:text-telefya-green"
                      >
                        <Award size={16} />
                        Certificate
                      </button>
                      <Link href={getRoomPath(meeting.meeting_url)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white shadow-soft hover:bg-telefya-violet">
                        <Video size={16} />
                        Join
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-navy-900">Networking</h2>
            <p className="mt-1 text-sm font-semibold text-navy-500">Attendees loaded from the backend user directory.</p>

            <div className="mt-5 grid gap-3">
              {loadingPage ? (
                <LoadingRow label="Loading attendees..." />
              ) : networking.length === 0 ? (
                <EmptyState icon={Network} title="No connections yet" text="Registered attendees will appear here." />
              ) : (
                networking.slice(0, 6).map((user) => (
                  <div key={user.user_id} className="rounded-xl bg-navy-50 px-4 py-3">
                    <p className="font-black text-navy-900">{displayName(user)}</p>
                    <p className="mt-1 text-xs font-semibold text-navy-400">{user.email}</p>
                    <p className="mt-1 text-xs font-semibold text-navy-400">
                      {[user.city, user.state, user.country].filter(Boolean).join(", ") || "Location not available"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-navy-900">Certificates</h2>
            <p className="mt-1 text-sm font-semibold text-navy-500">Generated attendance certificates.</p>

            <div className="mt-5 grid gap-3">
              {loadingPage ? (
                <LoadingRow label="Loading certificates..." />
              ) : certificates.length === 0 ? (
                <EmptyState icon={Award} title="No certificates yet" text="Generate one from any meeting in your agenda." />
              ) : (
                certificates.map((certificate) => (
                  <div key={certificate.id} className="rounded-xl border border-border bg-white p-4 shadow-soft">
                    <p className="font-black text-navy-900">{certificate.title}</p>
                    <p className="mt-1 text-xs font-semibold text-navy-400">{certificate.certificate_code}</p>
                    <p className="mt-2 text-xs font-bold text-telefya-green">
                      {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString() : "Issued"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-navy-900">Profile snapshot</h2>
            <p className="mt-1 text-sm font-semibold text-navy-500">Synced from backend profile.</p>

            {profileLoading ? (
              <LoadingRow label="Loading profile..." />
            ) : profile ? (
              <div className="mt-5 grid gap-3">
                <Info label="Name" value={currentUserName} />
                <Info label="Email" value={profile.email} />
                <Info label="Verification" value={profile.is_verified ? "Verified" : "Pending"} />
              </div>
            ) : null}
          </section>
        </aside>
      </section>
    </div>
  );
}

function FeatureCard({ title, desc, icon: Icon, status }: { title: string; desc: string; icon: LucideIcon; status: string }) {
  return (
    <article className="telefya-surface rounded-xl p-5">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-telefya-blue">
        <Icon size={23} />
      </div>
      <h2 className="mt-5 text-lg font-black text-navy-900">{title}</h2>
      <p className="mt-3 min-h-12 text-sm leading-6 text-navy-500">{desc}</p>
      <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-telefya-green">{status}</span>
    </article>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-navy-50 px-4 py-3">
      <span className="text-sm font-bold text-navy-500">{label}</span>
      <span className="inline-flex items-center gap-1.5 text-sm font-black text-navy-900">
        <CheckCircle2 size={15} className="text-telefya-green" />
        {value}
      </span>
    </div>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-navy-50 p-4 font-bold text-navy-500">
      <Loader2 size={17} className="animate-spin text-telefya-blue" />
      {label}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-navy-50 p-5 text-center">
      <Icon size={30} className="mx-auto text-telefya-violet" />
      <p className="mt-3 font-black text-navy-900">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">{text}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl bg-navy-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">{label}</p>
      <p className="mt-1 break-all font-bold text-navy-900">{value || "Not available"}</p>
    </div>
  );
}