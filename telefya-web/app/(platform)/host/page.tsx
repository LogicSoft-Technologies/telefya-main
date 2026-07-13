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
  Settings2,
  ShieldCheck,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMeetings, type ScheduledMeeting } from "@/lib/api/meetings";
import { useCurrentUser } from "@/hooks/use-current-user";

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
  if (!timeZone) return "No scheduled time";

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

const controls = [
  {
    title: "Camera",
    desc: "Local camera preview is available before joining a room.",
    icon: Video,
    status: "Live",
  },
  {
    title: "Microphone",
    desc: "Mic permission and mute state are checked locally.",
    icon: Mic,
    status: "Live",
  },
  {
    title: "Screen share",
    desc: "Available inside the live meeting room.",
    icon: MonitorUp,
    status: "Live room",
  },
  {
    title: "Moderation",
    desc: "Needs host/speaker moderation endpoint.",
    icon: ShieldCheck,
    status: "API needed",
  },
];

export default function SpeakerPage() {
  const { profile, loading: profileLoading, error: profileError, reload } =
    useCurrentUser();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [ready, setReady] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [meetingsError, setMeetingsError] = useState("");

  const displayName = useMemo(() => {
    return (
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      profile?.email ||
      "Speaker"
    );
  }, [profile]);

  async function loadMeetings() {
    setMeetingsError("");
    setMeetingsLoading(true);

    try {
      const data = await getMeetings();
      setMeetings(data);
    } catch (err) {
      setMeetingsError(
        err instanceof Error ? err.message : "Unable to load meetings."
      );
    } finally {
      setMeetingsLoading(false);
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
          : "Unable to access camera or microphone."
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
    loadMeetings();
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = previewStream;
  }, [previewStream]);

  useEffect(() => {
    return () => {
      previewStream?.getTracks().forEach((track) => track.stop());
    };
  }, [previewStream]);

  const nextMeeting = meetings[0];

  return (
    <div className="grid gap-6">
      <section className="telefya-aurora overflow-hidden rounded-xl border border-border bg-white shadow-enterprise">
        <div className="telefya-accent-line h-1" />

        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_360px] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-navy-500 shadow-soft">
              <Mic size={15} className="text-telefya-violet" />
              Speaker dashboard
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-navy-900 lg:text-4xl">
              Prepare your session,{" "}
              <span className="telefya-text-gradient">{displayName}</span>
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-8 text-navy-500">
              Check your camera and microphone, review scheduled rooms, and join
              the live stage when you are ready.
            </p>
          </div>

          <div className="rounded-xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
              Speaker status
            </p>

            <strong className="mt-3 block text-3xl font-black text-navy-900">
              {ready ? "Ready" : "Not ready"}
            </strong>

            <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
              This status is local for now. Backend speaker status endpoint is
              still needed.
            </p>

            <button
              onClick={() => setReady((value) => !value)}
              className={[
                "mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black shadow-soft",
                ready
                  ? "border border-border bg-white text-navy-800 hover:border-telefya-violet hover:text-telefya-violet"
                  : "bg-telefya-blue text-white hover:bg-telefya-violet",
              ].join(" ")}
            >
              <CheckCircle2 size={17} />
              {ready ? "Mark not ready" : "Mark ready"}
            </button>
          </div>
        </div>
      </section>

      {(profileError || meetingsError || previewError) ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{profileError || meetingsError || previewError}</span>
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {controls.map((item) => (
          <article key={item.title} className="telefya-surface rounded-xl p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-telefya-blue">
              <item.icon size={23} />
            </div>

            <h2 className="mt-5 text-lg font-black text-navy-900">
              {item.title}
            </h2>

            <p className="mt-3 min-h-12 text-sm leading-6 text-navy-500">
              {item.desc}
            </p>

            <span
              className={[
                "mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black",
                item.status === "API needed"
                  ? "bg-amber-50 text-telefya-gold"
                  : item.status === "Live room"
                    ? "bg-violet-50 text-telefya-violet"
                    : "bg-emerald-50 text-telefya-green",
              ].join(" ")}
            >
              {item.status}
            </span>
          </article>
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
                Test local camera and microphone before joining a live room.
              </p>
            </div>

            <button
              onClick={previewStream ? stopPreview : startPreview}
              className={[
                "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-black shadow-soft",
                previewStream
                  ? "border border-border bg-white text-navy-700 hover:border-red-200 hover:text-red-600"
                  : "bg-telefya-blue text-white hover:bg-telefya-violet",
              ].join(" ")}
            >
              {previewStream ? <VideoOff size={16} /> : <Video size={16} />}
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
                    <Video size={44} className="mx-auto text-white/55" />
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
              <button
                onClick={toggleMic}
                disabled={!previewStream}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-700 hover:border-telefya-blue hover:text-telefya-blue disabled:cursor-not-allowed disabled:opacity-50"
              >
                {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                {micOn ? "Mic on" : "Mic off"}
              </button>

              <button
                onClick={toggleCamera}
                disabled={!previewStream}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-700 hover:border-telefya-blue hover:text-telefya-blue disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                {cameraOn ? "Camera on" : "Camera off"}
              </button>

              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black text-navy-700 hover:border-telefya-blue hover:text-telefya-blue">
                <Settings2 size={18} />
                Settings
              </button>
            </div>
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-navy-900">Next session</h2>
            <p className="mt-1 text-sm font-semibold text-navy-500">
              Pulled from scheduled meetings.
            </p>

            {meetingsLoading ? (
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-navy-50 p-4 font-bold text-navy-500">
                <Loader2 size={17} className="animate-spin text-telefya-blue" />
                Loading meetings...
              </div>
            ) : nextMeeting ? (
              <div className="mt-5 rounded-xl bg-navy-50 p-4">
                <h3 className="font-black text-navy-900">
                  {nextMeeting.des || "Telefya meeting"}
                </h3>
                <p className="mt-2 text-sm font-semibold text-navy-500">
                  {getMeetingDateLabel(nextMeeting.time_zone)}
                </p>
                <p className="mt-3 break-all text-xs font-bold text-navy-300">
                  {decodeStoredText(nextMeeting.meeting_url)}
                </p>

                <Link
                  href={getRoomPath(nextMeeting.meeting_url)}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white shadow-soft hover:bg-telefya-violet"
                >
                  <Video size={16} />
                  Join backstage
                </Link>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-border bg-navy-50 p-5 text-center">
                <MonitorUp size={30} className="mx-auto text-telefya-violet" />
                <p className="mt-3 font-black text-navy-900">
                  No speaker sessions yet
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">
                  Create a meeting first, then it will appear here.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-navy-900">
              Speaker materials
            </h2>
            <p className="mt-1 text-sm font-semibold text-navy-500">
              Uploads need a backend endpoint before files can be stored.
            </p>

            <button
              disabled
              className="mt-5 inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border bg-navy-50 px-4 text-sm font-black text-navy-400"
            >
              <FileUp size={17} />
              Upload file
            </button>

            <div className="mt-5 grid gap-3">
              <ApiNeeded label="Speaker file upload" />
              <ApiNeeded label="Speaker notes" />
              <ApiNeeded label="Host approval status" />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-navy-900">
              Profile status
            </h2>

            {profileLoading ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-navy-50 p-4 font-bold text-navy-500">
                <Loader2 size={17} className="animate-spin text-telefya-blue" />
                Loading profile...
              </div>
            ) : profile ? (
              <div className="mt-4 grid gap-3">
                <Info label="Name" value={displayName} />
                <Info label="Email" value={profile.email} />
                <Info
                  label="Verification"
                  value={profile.is_verified ? "Verified" : "Pending"}
                />
              </div>
            ) : (
              <button
                onClick={reload}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-black text-navy-700 hover:border-telefya-blue hover:text-telefya-blue"
              >
                <RefreshCcw size={16} />
                Retry profile
              </button>
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
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

function ApiNeeded({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-navy-50 px-4 py-3">
      <span className="text-sm font-bold text-navy-700">{label}</span>
      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-telefya-gold">
        API needed
      </span>
    </div>
  );
}