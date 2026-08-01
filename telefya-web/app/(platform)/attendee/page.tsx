"use client";

import Link from "next/link";
import {
  AlertCircle,
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

import { useCurrentUser } from "@/hooks/use-current-user";
import {
  generateCertificate,
  listAttendeeMeetings,
  listAttendeeNetworking,
  listCertificates,
  respondToMeetingInvitation,
  type AssignedMeeting,
  type AttendeeCertificate,
  type AttendeeNetworkUser,
} from "@/lib/api/workspace";

type AttendeeMeetingView = {
  meetingId: string | number;
  memberId: string | number;
  title: string;
  meetingUrl: string;
  scheduledFor?: string | null;
  timeZone?: string | null;
  membershipStatus: "invited" | "accepted" | "declined" | "removed";
};

function decodeStoredText(value?: string | null) {
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

function getRoomPath(meetingUrl?: string | null) {
  const decodedUrl = decodeStoredText(meetingUrl);

  try {
    return new URL(decodedUrl).pathname;
  } catch {
    return decodedUrl.startsWith("/live")
      ? decodedUrl
      : "/live/test-room-1";
  }
}

function getMeetingDateLabel(meeting: AttendeeMeetingView) {
  const value = meeting.scheduledFor || meeting.timeZone;

  if (!value) return "Schedule unavailable";

  const decoded = decodeStoredText(value);
  const isoValue = decoded.includes("T")
    ? decoded
    : decoded.replace(" ", "T");

  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(isoValue);
  const date = new Date(
    hasTimezone ? isoValue : `${isoValue}Z`,
  );

  if (Number.isNaN(date.getTime())) {
    return decoded;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function normalizeMeeting(
  meeting: AssignedMeeting,
): AttendeeMeetingView | null {
  const value = meeting as unknown as Omit<AssignedMeeting, "status"> & {
    id?: string | number;
    meeting_id?: string | number;
    member_id?: string | number;
    membership_id?: string | number;
    status?: AttendeeMeetingView["membershipStatus"];
    member_status?: AttendeeMeetingView["membershipStatus"];
    membership_status?: AttendeeMeetingView["membershipStatus"];
    meeting_url?: string;
    des?: string;
    title?: string;
    scheduled_for?: string | null;
    time_zone?: string | null;
  };

  const meetingId = value.meeting_id ?? value.id;
  const memberId = value.member_id ?? value.membership_id;

  if (meetingId === undefined || memberId === undefined) {
    return null;
  }

  return {
    meetingId,
    memberId,
    title: value.title || value.des || "Telefya meeting",
    meetingUrl: value.meeting_url || "",
    scheduledFor: value.scheduled_for,
    timeZone: value.time_zone,
    membershipStatus:
      value.membership_status ??
      value.member_status ??
      value.status ??
      "invited",
  };
}

function getNetworkName(user: AttendeeNetworkUser) {
  const value = user as AttendeeNetworkUser & {
    name?: string;
    display_name?: string;
  };

  return (
    value.display_name ||
    value.name ||
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    "Telefya attendee"
  );
}

function getNetworkLocation(user: AttendeeNetworkUser) {
  return [user.city, user.state, user.country]
    .filter(Boolean)
    .join(", ");
}

export default function AttendeePage() {
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    reload,
  } = useCurrentUser();

  const [meetings, setMeetings] = useState<AttendeeMeetingView[]>([]);
  const [networking, setNetworking] = useState<
    AttendeeNetworkUser[]
  >([]);
  const [certificates, setCertificates] = useState<
    AttendeeCertificate[]
  >([]);

  const [loadingPage, setLoadingPage] = useState(true);
  const [respondingToInvite, setRespondingToInvite] = useState(false);
  const [creatingCertificateId, setCreatingCertificateId] =
    useState<string | number | null>(null);

  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");

  const currentUserName = useMemo(
    () =>
      [profile?.first_name, profile?.last_name]
        .filter(Boolean)
        .join(" ") ||
      profile?.email ||
      "Attendee",
    [profile],
  );

  const pendingMeetings = useMemo(
    () =>
      meetings.filter(
        (meeting) => meeting.membershipStatus === "invited",
      ),
    [meetings],
  );

  const acceptedMeetings = useMemo(
    () =>
      meetings.filter(
        (meeting) => meeting.membershipStatus === "accepted",
      ),
    [meetings],
  );

  async function loadPage() {
    setLoadingPage(true);
    setPageError("");

    try {
      const [
        meetingsResponse,
        networkingResponse,
        certificatesResponse,
      ] = await Promise.all([
        listAttendeeMeetings(),
        listAttendeeNetworking(),
        listCertificates(),
      ]);

      const nextMeetings = (meetingsResponse.data || [])
        .map(normalizeMeeting)
        .filter(
          (
            meeting,
          ): meeting is AttendeeMeetingView => Boolean(meeting),
        )
        .filter(
          (meeting) =>
            meeting.membershipStatus !== "declined" &&
            meeting.membershipStatus !== "removed",
        );

      setMeetings(nextMeetings);
      setNetworking(networkingResponse.data || []);
      setCertificates(certificatesResponse.data || []);
    } catch (err) {
      setPageError(
        err instanceof Error
          ? err.message
          : "Unable to load attendee workspace.",
      );
    } finally {
      setLoadingPage(false);
    }
  }

  async function handleInvitation(
    meeting: AttendeeMeetingView,
    status: "accepted" | "declined",
  ) {
    setRespondingToInvite(true);
    setPageError("");
    setMessage("");

    try {
      await respondToMeetingInvitation(meeting.memberId, status);

      setMessage(
        status === "accepted"
          ? "Meeting invitation accepted."
          : "Meeting invitation declined.",
      );

      await loadPage();
    } catch (err) {
      setPageError(
        err instanceof Error
          ? err.message
          : "Unable to update invitation.",
      );
    } finally {
      setRespondingToInvite(false);
    }
  }

  async function handleGenerateCertificate(
    meeting: AttendeeMeetingView,
  ) {
    setCreatingCertificateId(meeting.meetingId);
    setPageError("");
    setMessage("");

    try {
      await generateCertificate({
        meeting_id: meeting.meetingId,
        title: `${meeting.title} Certificate`,
      });

      const response = await listCertificates();
      setCertificates(response.data || []);
      setMessage("Certificate generated successfully.");
    } catch (err) {
      setPageError(
        err instanceof Error
          ? err.message
          : "A certificate is available only after verified attendance.",
      );
    } finally {
      setCreatingCertificateId(null);
    }
  }

  useEffect(() => {
    void loadPage();
  }, []);

  const attendeeTools = [
    {
      title: "Sessions",
      icon: CalendarDays,
      desc: `${acceptedMeetings.length} accepted meeting${
        acceptedMeetings.length === 1 ? "" : "s"
      }.`,
      status: "Synced",
    },
    {
      title: "Chat",
      icon: MessageSquare,
      desc: "Available after joining a meeting room.",
      status: "In room",
    },
    {
      title: "Profile",
      icon: UserRound,
      desc: "Synced from your authenticated account.",
      status: profile ? "Synced" : "Loading",
    },
    {
      title: "Networking",
      icon: Network,
      desc: `${networking.length} shared-session connection${
        networking.length === 1 ? "" : "s"
      }.`,
      status: "Private",
    },
    {
      title: "Certificates",
      icon: Award,
      desc: `${certificates.length} certificate${
        certificates.length === 1 ? "" : "s"
      } issued.`,
      status: "Verified",
    },
  ];

  const currentError = profileError || pageError;

  return (
    <div className="grid gap-6">
      <section className="telefya-aurora overflow-hidden rounded-xl border border-border bg-white shadow-enterprise">
        <div className="telefya-accent-line h-1" />

        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_340px] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-navy-500 shadow-soft">
              <UserRound size={15} className="text-telefya-violet" />
              Attendee workspace
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-navy-900 lg:text-4xl">
              Welcome,{" "}
              <span className="telefya-text-gradient">
                {currentUserName}
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-8 text-navy-500">
              Review invitations, join your confirmed sessions, and
              access attendance records.
            </p>
          </div>

          <div className="rounded-xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
              Workspace status
            </p>

            <div className="mt-4 grid gap-3">
              <StatusRow
                label="Profile"
                value={profile ? "Synced" : "Loading"}
              />
              <StatusRow
                label="Sessions"
                value={`${acceptedMeetings.length} confirmed`}
              />
              <StatusRow
                label="Certificates"
                value={`${certificates.length} issued`}
              />
            </div>
          </div>
        </div>
      </section>

      {currentError || message ? (
        <div
          className={[
            "flex items-start gap-3 rounded-xl border p-4 text-sm font-bold",
            message && !currentError
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          {message && !currentError ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
          )}

          <span>{currentError || message}</span>

          {currentError ? (
            <button
              onClick={() => {
                void reload();
                void loadPage();
              }}
              className="ml-auto inline-flex shrink-0 items-center gap-2 underline"
            >
              <RefreshCcw size={15} />
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      {pendingMeetings.length > 0 ? (
        <section className="rounded-xl border border-violet-200 bg-violet-50/60 p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <CalendarDays
              size={21}
              className="mt-0.5 shrink-0 text-telefya-violet"
            />

            <div>
              <h2 className="font-black text-navy-900">
                Meeting invitations
              </h2>

              <p className="mt-1 text-sm font-semibold leading-6 text-navy-500">
                Accept an invitation to add the meeting to your
                confirmed agenda.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {pendingMeetings.map((meeting) => (
              <article
                key={String(meeting.memberId)}
                className="flex flex-col gap-4 rounded-xl border border-white bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="truncate font-black text-navy-900">
                    {meeting.title}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-navy-500">
                    {getMeetingDateLabel(meeting)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button
                    onClick={() =>
                      void handleInvitation(meeting, "accepted")
                    }
                    disabled={respondingToInvite}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white hover:bg-telefya-violet disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {respondingToInvite ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    Accept
                  </button>

                  <button
                    onClick={() =>
                      void handleInvitation(meeting, "declined")
                    }
                    disabled={respondingToInvite}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-700 hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
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
              <h2 className="text-xl font-black text-navy-900">
                My agenda
              </h2>

              <p className="mt-1 text-sm font-semibold text-navy-500">
                Confirmed attendee sessions only.
              </p>
            </div>

            <button
              onClick={() => void loadPage()}
              disabled={loadingPage}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-700 hover:border-telefya-blue hover:text-telefya-blue disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCcw
                size={16}
                className={loadingPage ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="p-5">
            {loadingPage ? (
              <LoadingRow label="Loading agenda..." />
            ) : acceptedMeetings.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No confirmed sessions"
                text="Accepted meeting invitations appear here."
              />
            ) : (
              <div className="grid gap-4">
                {acceptedMeetings.map((meeting) => {
                  const creatingCertificate =
                    String(creatingCertificateId) ===
                    String(meeting.meetingId);

                  return (
                    <article
                      key={String(meeting.memberId)}
                      className="grid gap-4 rounded-xl border border-border bg-white p-4 shadow-soft transition hover:border-telefya-blue/40 md:grid-cols-[1fr_auto] md:items-center"
                    >
                      <div className="min-w-0">
                        <h3 className="font-black text-navy-900">
                          {meeting.title}
                        </h3>

                        <p className="mt-2 text-sm font-semibold text-navy-500">
                          {getMeetingDateLabel(meeting)}
                        </p>

                        <p className="mt-2 break-all text-xs font-bold text-navy-300">
                          {decodeStoredText(meeting.meetingUrl)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            void handleGenerateCertificate(meeting)
                          }
                          disabled={creatingCertificate}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-black text-navy-700 hover:border-telefya-green hover:text-telefya-green disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {creatingCertificate ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Award size={16} />
                          )}
                          Certificate
                        </button>

                        <Link
                          href={getRoomPath(meeting.meetingUrl)}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white shadow-soft hover:bg-telefya-violet"
                        >
                          <Video size={16} />
                          Join
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-navy-900">
              Networking
            </h2>

            <p className="mt-1 text-sm font-semibold text-navy-500">
              Connections from your shared confirmed sessions.
            </p>

            <div className="mt-5 grid gap-3">
              {loadingPage ? (
                <LoadingRow label="Loading connections..." />
              ) : networking.length === 0 ? (
                <EmptyState
                  icon={Network}
                  title="No shared connections"
                  text="People from shared attendee sessions appear here."
                />
              ) : (
                networking.slice(0, 8).map((user) => (
                  <div
                    key={user.user_id}
                    className="rounded-xl bg-navy-50 px-4 py-3"
                  >
                    <p className="font-black text-navy-900">
                      {getNetworkName(user)}
                    </p>

                    {getNetworkLocation(user) ? (
                      <p className="mt-1 text-xs font-semibold text-navy-400">
                        {getNetworkLocation(user)}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs font-semibold text-navy-400">
                        Shared Telefya session
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-navy-900">
              Certificates
            </h2>

            <p className="mt-1 text-sm font-semibold text-navy-500">
              Issued after verified meeting attendance.
            </p>

            <div className="mt-5 grid gap-3">
              {loadingPage ? (
                <LoadingRow label="Loading certificates..." />
              ) : certificates.length === 0 ? (
                <EmptyState
                  icon={Award}
                  title="No certificates yet"
                  text="After attending an eligible session, request its certificate from your agenda."
                />
              ) : (
                certificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="rounded-xl border border-border bg-white p-4 shadow-soft"
                  >
                    <p className="font-black text-navy-900">
                      {certificate.title}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-navy-400">
                      {certificate.certificate_code}
                    </p>

                    <p className="mt-2 text-xs font-bold text-telefya-green">
                      {certificate.issued_at
                        ? new Date(
                            certificate.issued_at,
                          ).toLocaleDateString()
                        : "Issued"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-navy-900">
              Profile snapshot
            </h2>

            <p className="mt-1 text-sm font-semibold text-navy-500">
              Synced from your account.
            </p>

            {profileLoading ? (
              <LoadingRow label="Loading profile..." />
            ) : profile ? (
              <div className="mt-5 grid gap-3">
                <Info label="Name" value={currentUserName} />
                <Info label="Email" value={profile.email} />
                <Info
                  label="Verification"
                  value={
                    profile.is_verified ? "Verified" : "Pending"
                  }
                />
              </div>
            ) : null}
          </section>
        </aside>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  icon: Icon,
  status,
}: {
  title: string;
  desc: string;
  icon: LucideIcon;
  status: string;
}) {
  return (
    <article className="telefya-surface rounded-xl p-5">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-telefya-blue">
        <Icon size={23} />
      </div>

      <h2 className="mt-5 text-lg font-black text-navy-900">
        {title}
      </h2>

      <p className="mt-3 min-h-12 text-sm leading-6 text-navy-500">
        {desc}
      </p>

      <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-telefya-green">
        {status}
      </span>
    </article>
  );
}

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-navy-50 px-4 py-3">
      <span className="text-sm font-bold text-navy-500">
        {label}
      </span>

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

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-navy-50 p-5 text-center">
      <Icon size={30} className="mx-auto text-telefya-violet" />
      <p className="mt-3 font-black text-navy-900">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
        {text}
      </p>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl bg-navy-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
        {label}
      </p>
      <p className="mt-1 break-all font-bold text-navy-900">
        {value || "Not available"}
      </p>
    </div>
  );
}