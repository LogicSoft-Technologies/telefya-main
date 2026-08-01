"use client";

import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Copy,
  Loader2,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Video,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  getMeetings,
  type ScheduledMeeting,
} from "@/lib/api/meetings";
import {
  inviteMeetingMember,
  listMeetingMembers,
  removeMeetingMember,
  type MeetingMemberRole,
} from "@/lib/api/workspace";
import { useCurrentUser } from "@/hooks/use-current-user";

type MemberStatus =
  | "invited"
  | "accepted"
  | "declined"
  | "removed";

type HostMemberView = {
  id: string | number;
  userId: string;
  role: MeetingMemberRole;
  status: MemberStatus;
  name: string;
  email: string;
  invitedAt?: string | null;
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

function getMeetingDateLabel(meeting?: ScheduledMeeting | null) {
  const value = meeting?.scheduled_for || meeting?.time_zone;

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

function normalizeMember(value: unknown): HostMemberView | null {
  const member = value as {
    id?: string | number;
    user_id?: string;
    member_role?: MeetingMemberRole;
    status?: MemberStatus;
    first_name?: string;
    last_name?: string;
    email?: string;
    invited_at?: string | null;
  };

  if (
    member.id === undefined ||
    !member.user_id ||
    !member.member_role ||
    !member.status
  ) {
    return null;
  }

  return {
    id: member.id,
    userId: member.user_id,
    role: member.member_role,
    status: member.status,
    name:
      [member.first_name, member.last_name]
        .filter(Boolean)
        .join(" ") || member.email || "Telefya member",
    email: member.email || "Email unavailable",
    invitedAt: member.invited_at,
  };
}

export default function HostPage() {
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    reload,
  } = useCurrentUser();

  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<
    string | number | null
  >(null);
  const [members, setMembers] = useState<HostMemberView[]>([]);

  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | number | null>(
    null,
  );

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] =
    useState<MeetingMemberRole>("attendee");

  const [copiedId, setCopiedId] = useState<string | number | null>(
    null,
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const displayName = useMemo(
    () =>
      [profile?.first_name, profile?.last_name]
        .filter(Boolean)
        .join(" ") ||
      profile?.email ||
      "Host",
    [profile],
  );

  const selectedMeeting = useMemo(
    () =>
      meetings.find(
        (meeting) =>
          String(meeting.id) === String(selectedMeetingId),
      ) || null,
    [meetings, selectedMeetingId],
  );

  const speakers = useMemo(
    () => members.filter((member) => member.role === "speaker"),
    [members],
  );

  const attendees = useMemo(
    () => members.filter((member) => member.role === "attendee"),
    [members],
  );

  async function loadMembers(meetingId: string | number) {
    setLoadingMembers(true);
    setError("");

    try {
      const response = await listMeetingMembers(meetingId);

      const payload = response.data as {
        members?: unknown[];
      };

      setMembers(
        (payload?.members || [])
          .map(normalizeMember)
          .filter(
            (member): member is HostMemberView => Boolean(member),
          ),
      );
    } catch (err) {
      setMembers([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load meeting members.",
      );
    } finally {
      setLoadingMembers(false);
    }
  }

  async function loadMeetings() {
    setLoadingMeetings(true);
    setError("");

    try {
      const data = await getMeetings();

      const upcoming = data.filter(
        (meeting) =>
          meeting.status === "upcoming" || meeting.status === "live",
      );

      setMeetings(upcoming);

      const currentSelection = upcoming.find(
        (meeting) =>
          String(meeting.id) === String(selectedMeetingId),
      );

      const nextMeeting = currentSelection || upcoming[0] || null;

      setSelectedMeetingId(nextMeeting?.id ?? null);

      if (nextMeeting) {
        await loadMembers(nextMeeting.id);
      } else {
        setMembers([]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load host meetings.",
      );
    } finally {
      setLoadingMeetings(false);
    }
  }

  async function handleSelectMeeting(meetingId: string | number) {
    setMessage("");
    setSelectedMeetingId(meetingId);
    await loadMembers(meetingId);
  }

  async function handleCopy(meeting: ScheduledMeeting) {
    try {
      await navigator.clipboard.writeText(
        decodeStoredText(meeting.meeting_url),
      );

      setCopiedId(meeting.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setError("Unable to copy the meeting link.");
    }
  }

  async function handleInvite(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedMeeting) {
      setError("Select a meeting before inviting members.");
      return;
    }

    const email = inviteEmail.trim().toLowerCase();

    if (!email) {
      setError("Enter an email address.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await inviteMeetingMember(selectedMeeting.id, {
        email,
        member_role: inviteRole,
      });

      setInviteEmail("");
      setInviteRole("attendee");
      setMessage(
        `${email} was invited as a ${inviteRole}.`,
      );

      await loadMembers(selectedMeeting.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send invitation.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(member: HostMemberView) {
    if (!selectedMeeting) return;

    setRemovingId(member.id);
    setError("");
    setMessage("");

    try {
      await removeMeetingMember(selectedMeeting.id, member.id);

      setMembers((current) =>
        current.filter((item) => String(item.id) !== String(member.id)),
      );

      setMessage(`${member.name} was removed from this meeting.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove meeting member.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  useEffect(() => {
    void loadMeetings();
  }, []);

  const currentError = profileError || error;

  return (
    <div className="grid gap-6">
      <section className="telefya-aurora overflow-hidden rounded-xl border border-border bg-white shadow-enterprise">
        <div className="telefya-accent-line h-1" />

        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_360px] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-navy-500 shadow-soft">
              <ShieldCheck
                size={15}
                className="text-telefya-violet"
              />
              Host console
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-navy-900 lg:text-4xl">
              Manage your sessions,{" "}
              <span className="telefya-text-gradient">
                {displayName}
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-8 text-navy-500">
              Invite speakers and attendees, review participation, and
              start the rooms you own.
            </p>
          </div>

          <div className="rounded-xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-400">
              Selected meeting
            </p>

            <strong className="mt-3 block truncate text-2xl font-black text-navy-900">
              {selectedMeeting?.des || "No meeting selected"}
            </strong>

            <p className="mt-2 text-sm font-semibold text-navy-500">
              {selectedMeeting
                ? getMeetingDateLabel(selectedMeeting)
                : "Create a meeting to begin."}
            </p>

            {selectedMeeting ? (
              <Link
                href={getRoomPath(selectedMeeting.meeting_url)}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white shadow-soft hover:bg-telefya-violet"
              >
                <Video size={17} />
                Start room
              </Link>
            ) : (
              <Link
                href="/meetings/create"
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white shadow-soft hover:bg-telefya-violet"
              >
                <Plus size={17} />
                Create meeting
              </Link>
            )}
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
                void loadMeetings();
              }}
              className="ml-auto inline-flex shrink-0 items-center gap-2 underline"
            >
              <RefreshCcw size={15} />
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-3">
        <MetricCard
          icon={CalendarDays}
          label="Hosted meetings"
          value={String(meetings.length)}
          tone="blue"
        />

        <MetricCard
          icon={Users}
          label="Accepted members"
          value={String(
            members.filter((member) => member.status === "accepted")
              .length,
          )}
          tone="green"
        />

        <MetricCard
          icon={UserPlus}
          label="Pending invitations"
          value={String(
            members.filter((member) => member.status === "invited")
              .length,
          )}
          tone="violet"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="rounded-xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-navy-900">
                My meetings
              </h2>

              <p className="mt-1 text-sm font-semibold text-navy-500">
                Meetings created by your account.
              </p>
            </div>

            <button
              onClick={() => void loadMeetings()}
              disabled={loadingMeetings}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border text-navy-600 hover:border-telefya-blue hover:text-telefya-blue disabled:opacity-50"
              aria-label="Refresh hosted meetings"
            >
              <RefreshCcw
                size={17}
                className={loadingMeetings ? "animate-spin" : ""}
              />
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {loadingMeetings ? (
              <LoadingRow label="Loading meetings..." />
            ) : meetings.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No hosted meetings"
                text="Create a meeting to invite speakers and attendees."
              />
            ) : (
              meetings.map((meeting) => {
                const selected =
                  String(meeting.id) === String(selectedMeetingId);

                return (
                  <button
                    key={meeting.id}
                    onClick={() => void handleSelectMeeting(meeting.id)}
                    className={[
                      "w-full rounded-xl border p-4 text-left transition",
                      selected
                        ? "border-telefya-blue bg-blue-50"
                        : "border-border bg-navy-50 hover:border-telefya-blue/50 hover:bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-black text-navy-900">
                          {meeting.des || "Telefya meeting"}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-navy-500">
                          {getMeetingDateLabel(meeting)}
                        </p>
                      </div>

                      {selected ? (
                        <CheckCircle2
                          size={18}
                          className="shrink-0 text-telefya-blue"
                        />
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="overflow-hidden rounded-xl border border-border bg-white shadow-soft">
          <div className="flex flex-col justify-between gap-4 border-b border-border px-5 py-5 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-black text-navy-900">
                Meeting members
              </h2>

              <p className="mt-1 text-sm font-semibold text-navy-500">
                Invite registered Telefya users as speakers or attendees.
              </p>
            </div>

            {selectedMeeting ? (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => void handleCopy(selectedMeeting)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-700 hover:border-telefya-green hover:text-telefya-green"
                >
                  {copiedId === selectedMeeting.id ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                  {copiedId === selectedMeeting.id
                    ? "Copied"
                    : "Copy link"}
                </button>

                <Link
                  href={getRoomPath(selectedMeeting.meeting_url)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white hover:bg-telefya-violet"
                >
                  <Video size={16} />
                  Start room
                </Link>
              </div>
            ) : null}
          </div>

          <div className="p-5">
            {!selectedMeeting ? (
              <EmptyState
                icon={Users}
                title="Select a meeting"
                text="Choose one of your meetings to manage its members."
              />
            ) : (
              <>
                <form
                  onSubmit={handleInvite}
                  className="grid gap-3 rounded-xl border border-violet-100 bg-violet-50/60 p-4 lg:grid-cols-[1fr_160px_auto] lg:items-end"
                >
                  <label className="grid gap-1.5">
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-navy-500">
                      Invite by email
                    </span>

                    <input
                      value={inviteEmail}
                      onChange={(event) =>
                        setInviteEmail(event.target.value)
                      }
                      type="email"
                      required
                      disabled={saving}
                      placeholder="name@example.com"
                      className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-navy-900 outline-none focus:border-telefya-violet focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-navy-500">
                      Access
                    </span>

                    <select
                      value={inviteRole}
                      onChange={(event) =>
                        setInviteRole(
                          event.target.value as MeetingMemberRole,
                        )
                      }
                      disabled={saving}
                      className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-bold text-navy-900 outline-none focus:border-telefya-violet focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="attendee">Attendee</option>
                      <option value="speaker">Speaker</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-telefya-violet px-5 text-sm font-black text-white shadow-soft hover:bg-telefya-purple disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <UserPlus size={17} />
                    )}
                    Send invitation
                  </button>
                </form>

                {loadingMembers ? (
                  <LoadingRow label="Loading meeting members..." />
                ) : (
                  <div className="mt-6 grid gap-6">
                    <MemberGroup
                      title="Speakers"
                      subtitle="Speakers can prepare materials and readiness for this meeting."
                      members={speakers}
                      removingId={removingId}
                      onRemove={handleRemoveMember}
                    />

                    <MemberGroup
                      title="Attendees"
                      subtitle="Attendees can accept the invitation and add this session to their agenda."
                      members={attendees}
                      removingId={removingId}
                      onRemove={handleRemoveMember}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </section>

      <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
        <h2 className="text-xl font-black text-navy-900">
          Host controls in the live room
        </h2>

        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-navy-500">
          When you start a room, the live meeting page gives you the
          host-only waiting-room approval controls. This console manages
          scheduled meeting access before the room begins.
        </p>
      </section>

      {profileLoading ? (
        <LoadingRow label="Loading host profile..." />
      ) : null}
    </div>
  );
}

function MemberGroup({
  title,
  subtitle,
  members,
  removingId,
  onRemove,
}: {
  title: string;
  subtitle: string;
  members: HostMemberView[];
  removingId: string | number | null;
  onRemove: (member: HostMemberView) => void;
}) {
  return (
    <section>
      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
        <div>
          <h3 className="font-black text-navy-900">{title}</h3>
          <p className="mt-1 text-sm font-semibold text-navy-500">
            {subtitle}
          </p>
        </div>

        <span className="text-sm font-black text-navy-500">
          {members.length}
        </span>
      </div>

      {members.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border bg-navy-50 px-4 py-5 text-sm font-semibold text-navy-500">
          No {title.toLowerCase()} invited yet.
        </div>
      ) : (
        <div className="mt-3 grid gap-3">
          {members.map((member) => {
            const removing =
              String(removingId) === String(member.id);

            return (
              <article
                key={member.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-black text-navy-900">
                      {member.name}
                    </p>

                    <MemberStatusBadge status={member.status} />
                  </div>

                  <p className="mt-1 truncate text-sm font-semibold text-navy-500">
                    {member.email}
                  </p>
                </div>

                <button
                  onClick={() => onRemove(member)}
                  disabled={removing}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {removing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Remove
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const styles = {
    invited: "bg-amber-50 text-telefya-gold",
    accepted: "bg-emerald-50 text-telefya-green",
    declined: "bg-red-50 text-red-600",
    removed: "bg-navy-50 text-navy-500",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-black capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
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
    <article className="telefya-surface rounded-xl p-5">
      <div
        className={`grid h-12 w-12 place-items-center rounded-xl ${tones[tone]}`}
      >
        <Icon size={22} />
      </div>

      <p className="mt-5 text-3xl font-black text-navy-900">{value}</p>
      <p className="mt-1 text-sm font-bold text-navy-500">{label}</p>
    </article>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="mt-5 flex items-center gap-3 rounded-xl bg-navy-50 p-4 font-bold text-navy-500">
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