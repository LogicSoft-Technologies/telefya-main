"use client";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  RefreshCcw,
  Save,
  ShieldCheck,
  Video,
  VideoOff,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { useCurrentUser } from "@/hooks/use-current-user";
import {
  createSpeakerMaterial,
  getSpeakerStatus,
  listSpeakerMaterials,
  listSpeakerMeetings,
  respondToMeetingInvitation,
  saveSpeakerStatus,
  type AssignedMeeting,
  type SpeakerMaterial,
  type SpeakerStatus,
} from "@/lib/api/workspace";

type SpeakerMeetingView = {
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

function getMeetingDateLabel(meeting: SpeakerMeetingView) {
  const value = meeting.scheduledFor || meeting.timeZone;

  if (!value) {
    return "Schedule unavailable";
  }

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
): SpeakerMeetingView | null {
  const value = meeting as unknown as Omit<AssignedMeeting, "status"> & {
    id?: string | number;
    meeting_id?: string | number;
    member_id?: string | number;
    membership_id?: string | number;
    status?: SpeakerMeetingView["membershipStatus"];
    member_status?: SpeakerMeetingView["membershipStatus"];
    membership_status?: SpeakerMeetingView["membershipStatus"];
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

  const status =
    value.membership_status ??
    value.member_status ??
    value.status ??
    "invited";

  return {
    meetingId,
    memberId,
    title: value.title || value.des || "Telefya meeting",
    meetingUrl: value.meeting_url || "",
    scheduledFor: value.scheduled_for,
    timeZone: value.time_zone,
    membershipStatus: status,
  };
}

function isReady(status?: SpeakerStatus | null) {
  return Boolean(status?.is_ready);
}

export default function SpeakerPage() {
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    reload,
  } = useCurrentUser();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [previewStream, setPreviewStream] =
    useState<MediaStream | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const [meetings, setMeetings] = useState<SpeakerMeetingView[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<
    string | number | null
  >(null);

  const [materials, setMaterials] = useState<SpeakerMaterial[]>([]);
  const [speakerStatus, setSpeakerStatus] =
    useState<SpeakerStatus | null>(null);

  const [materialTitle, setMaterialTitle] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingMeetingData, setLoadingMeetingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [respondingToInvite, setRespondingToInvite] = useState(false);
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");

  const displayName = useMemo(
    () =>
      [profile?.first_name, profile?.last_name]
        .filter(Boolean)
        .join(" ") ||
      profile?.email ||
      "Speaker",
    [profile],
  );

  const selectedMeeting = useMemo(
    () =>
      meetings.find(
        (meeting) =>
          String(meeting.meetingId) === String(selectedMeetingId),
      ) || null,
    [meetings, selectedMeetingId],
  );

  const activeMeetings = useMemo(
    () =>
      meetings.filter(
        (meeting) => meeting.membershipStatus === "accepted",
      ),
    [meetings],
  );

  const pendingMeetings = useMemo(
    () =>
      meetings.filter(
        (meeting) => meeting.membershipStatus === "invited",
      ),
    [meetings],
  );

  async function loadMeetingWorkspace(meetingId: string | number) {
    setLoadingMeetingData(true);
    setPageError("");

    try {
      const [statusResponse, materialsResponse] = await Promise.all([
        getSpeakerStatus(meetingId),
        listSpeakerMaterials(meetingId),
      ]);

      const nextStatus = statusResponse.data || null;

      setSpeakerStatus(nextStatus);
      setNotes(nextStatus?.notes || "");
      setMaterials(materialsResponse.data || []);
    } catch (err) {
      setSpeakerStatus(null);
      setMaterials([]);
      setNotes("");

      setPageError(
        err instanceof Error
          ? err.message
          : "Unable to load this speaker workspace.",
      );
    } finally {
      setLoadingMeetingData(false);
    }
  }

  async function loadPage() {
    setLoadingPage(true);
    setPageError("");

    try {
      const response = await listSpeakerMeetings();

      const nextMeetings = (response.data || [])
        .map(normalizeMeeting)
        .filter(
          (
            meeting,
          ): meeting is SpeakerMeetingView => Boolean(meeting),
        )
        .filter(
          (meeting) =>
            meeting.membershipStatus !== "declined" &&
            meeting.membershipStatus !== "removed",
        );

      setMeetings(nextMeetings);

      const firstAccepted =
        nextMeetings.find(
          (meeting) => meeting.membershipStatus === "accepted",
        ) || null;

      setSelectedMeetingId(firstAccepted?.meetingId ?? null);

      if (firstAccepted) {
        await loadMeetingWorkspace(firstAccepted.meetingId);
      } else {
        setSpeakerStatus(null);
        setMaterials([]);
        setNotes("");
      }
    } catch (err) {
      setPageError(
        err instanceof Error
          ? err.message
          : "Unable to load speaker workspace.",
      );
    } finally {
      setLoadingPage(false);
    }
  }

  async function selectMeeting(meetingId: string | number) {
    setMessage("");
    setSelectedMeetingId(meetingId);
    await loadMeetingWorkspace(meetingId);
  }

  async function handleInvitation(
    meeting: SpeakerMeetingView,
    status: "accepted" | "declined",
  ) {
    setRespondingToInvite(true);
    setPageError("");
    setMessage("");

    try {
      await respondToMeetingInvitation(meeting.memberId, status);

      if (status === "accepted") {
        setMessage("Speaker invitation accepted.");
        setSelectedMeetingId(meeting.meetingId);
      } else {
        setMessage("Speaker invitation declined.");
      }

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

  async function toggleReady() {
    if (!selectedMeeting) return;

    setSaving(true);
    setPageError("");
    setMessage("");

    try {
      const response = await saveSpeakerStatus({
        meeting_id: selectedMeeting.meetingId,
        is_ready: !isReady(speakerStatus),
        notes,
      });

      setSpeakerStatus(response.data || null);
      setNotes(response.data?.notes || notes);
      setMessage(
        !isReady(speakerStatus)
          ? "You are marked ready."
          : "You are marked not ready.",
      );
    } catch (err) {
      setPageError(
        err instanceof Error
          ? err.message
          : "Unable to save speaker status.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    if (!selectedMeeting) return;

    setSaving(true);
    setPageError("");
    setMessage("");

    try {
      const response = await saveSpeakerStatus({
        meeting_id: selectedMeeting.meetingId,
        is_ready: isReady(speakerStatus),
        notes,
      });

      setSpeakerStatus(response.data || null);
      setNotes(response.data?.notes || notes);
      setMessage("Speaker notes saved.");
    } catch (err) {
      setPageError(
        err instanceof Error
          ? err.message
          : "Unable to save speaker notes.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function addMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMeeting) return;

    if (!materialTitle.trim() || !materialUrl.trim()) {
      setPageError("Enter both a material title and link.");
      return;
    }

    setSaving(true);
    setPageError("");
    setMessage("");

    try {
      await createSpeakerMaterial({
        meeting_id: selectedMeeting.meetingId,
        title: materialTitle.trim(),
        file_url: materialUrl.trim(),
        file_name: materialTitle.trim(),
      });

      setMaterialTitle("");
      setMaterialUrl("");

      const response = await listSpeakerMaterials(
        selectedMeeting.meetingId,
      );

      setMaterials(response.data || []);
      setMessage("Speaker material saved.");
    } catch (err) {
      setPageError(
        err instanceof Error
          ? err.message
          : "Unable to save speaker material.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function startPreview() {
    setPreviewError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      setPreviewStream(stream);
      setMicOn(true);
      setCameraOn(true);
    } catch (err) {
      setPreviewError(
        err instanceof Error
          ? err.message
          : "Unable to access camera or microphone.",
      );
    }
  }

  function stopPreview() {
    previewStream?.getTracks().forEach((track) => track.stop());
    setPreviewStream(null);
    setMicOn(false);
    setCameraOn(false);
  }

  function toggleMic() {
    if (!previewStream) return;

    const next = !micOn;

    previewStream.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });

    setMicOn(next);
  }

  function toggleCamera() {
    if (!previewStream) return;

    const next = !cameraOn;

    previewStream.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });

    setCameraOn(next);
  }

  useEffect(() => {
    void loadPage();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  useEffect(() => {
    return () => {
      previewStream?.getTracks().forEach((track) => track.stop());
    };
  }, [previewStream]);

  const ready = isReady(speakerStatus);

  const controls = [
    {
      title: "Camera",
      desc: "Test your camera locally before joining.",
      icon: Video,
      status: previewStream ? "Live" : "Not started",
    },
    {
      title: "Microphone",
      desc: "Check microphone access and mute state.",
      icon: Mic,
      status: previewStream ? "Live" : "Not started",
    },
    {
      title: "Screen share",
      desc: "Available after you join an accepted meeting.",
      icon: MonitorUp,
      status: "In room",
    },
    {
      title: "Readiness",
      desc: selectedMeeting
        ? "Saved for the selected speaker session."
        : "Select an accepted session first.",
      icon: ShieldCheck,
      status: ready ? "Ready" : "Not ready",
    },
  ];

  const currentError = profileError || pageError || previewError;

  return (
    <div className="grid gap-6">
      <section className="telefya-aurora overflow-hidden rounded-xl border border-border bg-white shadow-enterprise">
        <div className="telefya-accent-line h-1" />

        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_360px] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-navy-500 shadow-soft">
              <Mic size={15} className="text-telefya-violet" />
              Speaker workspace
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-navy-900 lg:text-4xl">
              Welcome,{" "}
              <span className="telefya-text-gradient">
                {displayName}
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-8 text-navy-500">
              Review your assigned sessions, prepare materials, and
              test your local setup.
            </p>
          </div>

          <div className="rounded-xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-400">
              Speaker readiness
            </p>

            <strong className="mt-3 block text-3xl font-black text-navy-900">
              {selectedMeeting
                ? ready
                  ? "Ready"
                  : "Not ready"
                : "No session selected"}
            </strong>

            <p className="mt-2 text-sm font-semibold text-navy-500">
              {selectedMeeting
                ? selectedMeeting.title
                : "Accept a speaker invitation to begin."}
            </p>

            <button
              onClick={() => void toggleReady()}
              disabled={!selectedMeeting || saving}
              className={[
                "mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black shadow-soft disabled:cursor-not-allowed disabled:opacity-50",
                ready
                  ? "border border-border bg-white text-navy-800 hover:border-telefya-violet hover:text-telefya-violet"
                  : "bg-telefya-blue text-white hover:bg-telefya-violet",
              ].join(" ")}
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <CheckCircle2 size={17} />
              )}

              {ready ? "Mark not ready" : "Mark ready"}
            </button>
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

          {profileError || pageError ? (
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
            <ShieldCheck
              size={21}
              className="mt-0.5 shrink-0 text-telefya-violet"
            />

            <div>
              <h2 className="font-black text-navy-900">
                Speaker invitations
              </h2>

              <p className="mt-1 text-sm font-semibold leading-6 text-navy-500">
                Accept an invitation before its session, materials, and
                backstage tools become available.
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

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {controls.map((item) => (
          <FeatureCard key={item.title} {...item} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-xl border border-border bg-white shadow-soft">
          <div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-black text-navy-900">
                Backstage preview
              </h2>

              <p className="mt-1 text-sm font-semibold text-navy-500">
                Test local camera and microphone before joining.
              </p>
            </div>

            <button
              onClick={
                previewStream
                  ? stopPreview
                  : () => void startPreview()
              }
              className={[
                "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-black shadow-soft",
                previewStream
                  ? "border border-border bg-white text-navy-700 hover:border-red-200 hover:text-red-600"
                  : "bg-telefya-blue text-white hover:bg-telefya-violet",
              ].join(" ")}
            >
              {previewStream ? (
                <VideoOff size={16} />
              ) : (
                <Video size={16} />
              )}
              {previewStream ? "Stop preview" : "Start preview"}
            </button>
          </div>

          <div className="p-5">
            <div className="relative overflow-hidden rounded-xl bg-navy-900">
              {previewStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="aspect-video w-full bg-navy-900 object-cover"
                />
              ) : (
                <div className="grid aspect-video place-items-center text-white">
                  <div className="text-center">
                    <Video
                      size={44}
                      className="mx-auto text-white/55"
                    />
                    <p className="mt-4 font-black">Camera preview</p>
                    <p className="mt-2 text-sm text-white/55">
                      Start preview to check local media.
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1.5 text-xs font-black text-white backdrop-blur">
                {previewStream ? "Local preview" : "Preview off"}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <PreviewButton
                disabled={!previewStream}
                onClick={toggleMic}
                icon={micOn ? Mic : MicOff}
                label={micOn ? "Mic on" : "Mic off"}
              />

              <PreviewButton
                disabled={!previewStream}
                onClick={toggleCamera}
                icon={cameraOn ? Video : VideoOff}
                label={cameraOn ? "Camera on" : "Camera off"}
              />

              <PreviewButton
                disabled
                icon={ShieldCheck}
                label={ready ? "Ready" : "Not ready"}
              />
            </div>
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-navy-900">
                  My sessions
                </h2>

                <p className="mt-1 text-sm font-semibold text-navy-500">
                  Accepted speaker invitations only.
                </p>
              </div>

              <button
                onClick={() => void loadPage()}
                disabled={loadingPage}
                className="grid h-10 w-10 place-items-center rounded-xl border border-border text-navy-600 hover:border-telefya-blue hover:text-telefya-blue disabled:opacity-50"
                aria-label="Refresh speaker sessions"
              >
                <RefreshCcw
                  size={17}
                  className={loadingPage ? "animate-spin" : ""}
                />
              </button>
            </div>

            {loadingPage || profileLoading ? (
              <LoadingRow label="Loading speaker sessions..." />
            ) : activeMeetings.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {activeMeetings.map((meeting) => {
                  const selected =
                    String(meeting.meetingId) ===
                    String(selectedMeetingId);

                  return (
                    <button
                      key={String(meeting.memberId)}
                      onClick={() =>
                        void selectMeeting(meeting.meetingId)
                      }
                      className={[
                        "w-full rounded-xl border p-4 text-left transition",
                        selected
                          ? "border-telefya-blue bg-blue-50"
                          : "border-border bg-navy-50 hover:border-telefya-blue/50 hover:bg-white",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-black text-navy-900">
                            {meeting.title}
                          </h3>

                          <p className="mt-1 text-sm font-semibold text-navy-500">
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
                })}
              </div>
            ) : (
              <EmptyState
                icon={MonitorUp}
                title="No accepted speaker sessions"
                text="When a host invites you as a speaker, the invitation will appear above."
              />
            )}

            {selectedMeeting ? (
              <Link
                href={getRoomPath(selectedMeeting.meetingUrl)}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white shadow-soft hover:bg-telefya-violet"
              >
                <Video size={16} />
                Join selected room
              </Link>
            ) : null}
          </section>

          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-navy-900">
              Speaker materials
            </h2>

            <p className="mt-1 text-sm font-semibold text-navy-500">
              {selectedMeeting
                ? `Materials for ${selectedMeeting.title}.`
                : "Select an accepted session to add materials."}
            </p>

            <form onSubmit={addMaterial} className="mt-5 grid gap-3">
              <input
                value={materialTitle}
                onChange={(event) =>
                  setMaterialTitle(event.target.value)
                }
                placeholder="Material title"
                disabled={!selectedMeeting || saving}
                className="h-11 rounded-xl border border-border bg-navy-50 px-3 text-sm font-bold text-navy-800 outline-none focus:border-telefya-blue focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />

              <input
                value={materialUrl}
                onChange={(event) =>
                  setMaterialUrl(event.target.value)
                }
                type="url"
                placeholder="https://..."
                disabled={!selectedMeeting || saving}
                className="h-11 rounded-xl border border-border bg-navy-50 px-3 text-sm font-bold text-navy-800 outline-none focus:border-telefya-blue focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={
                  !selectedMeeting ||
                  saving ||
                  !materialTitle.trim() ||
                  !materialUrl.trim()
                }
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white hover:bg-telefya-violet disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <FileUp size={17} />
                )}
                Save material
              </button>
            </form>

            <div className="mt-5 grid gap-3">
              {loadingMeetingData ? (
                <LoadingRow label="Loading materials..." />
              ) : materials.length === 0 ? (
                <EmptyState
                  icon={FileUp}
                  title="No materials yet"
                  text="Links and speaker resources for this session appear here."
                />
              ) : (
                materials.map((item) => (
                  <a
                    key={item.id}
                    href={item.file_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-navy-50 px-4 py-3 transition hover:bg-blue-50"
                  >
                    <p className="font-black text-navy-900">
                      {item.title}
                    </p>

                    <p className="mt-1 truncate text-xs font-semibold text-navy-400">
                      {item.file_url || item.file_name || "Open material"}
                    </p>
                  </a>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-navy-900">
              Speaker notes
            </h2>

            <p className="mt-1 text-sm font-semibold text-navy-500">
              Notes are private to this selected session.
            </p>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={!selectedMeeting || saving}
              placeholder="Private prep notes..."
              className="mt-4 min-h-28 w-full rounded-xl border border-border bg-navy-50 p-3 text-sm font-semibold text-navy-700 outline-none focus:border-telefya-blue focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />

            <button
              onClick={() => void saveNotes()}
              disabled={!selectedMeeting || saving}
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-black text-navy-700 hover:border-telefya-blue hover:text-telefya-blue disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save notes
            </button>
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

function PreviewButton({
  disabled,
  onClick,
  icon: Icon,
  label,
}: {
  disabled?: boolean;
  onClick?: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black capitalize text-navy-700 hover:border-telefya-blue hover:text-telefya-blue disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon size={18} />
      {label}
    </button>
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
    <div className="mt-5 rounded-xl border border-dashed border-border bg-navy-50 p-5 text-center">
      <Icon size={30} className="mx-auto text-telefya-violet" />
      <p className="mt-3 font-black text-navy-900">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
        {text}
      </p>
    </div>
  );
}