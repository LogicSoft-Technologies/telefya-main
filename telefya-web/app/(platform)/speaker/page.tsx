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
import { useEffect, useMemo, useRef, useState } from "react";
import { getMeetings, type ScheduledMeeting } from "@/lib/api/meetings";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  createSpeakerMaterial,
  getSpeakerStatus,
  listSpeakerMaterials,
  saveSpeakerStatus,
  type SpeakerMaterial,
  type SpeakerStatus,
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

const emptyStatus: SpeakerStatus = {
  user_id: "",
  is_ready: false,
  approval_status: "pending",
  notes: "",
};

export default function SpeakerPage() {
  const { profile, loading: profileLoading, error: profileError, reload } = useCurrentUser();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
  const [materials, setMaterials] = useState<SpeakerMaterial[]>([]);
  const [speakerStatus, setSpeakerStatus] = useState<SpeakerStatus>(emptyStatus);
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");

  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");

  const displayName = useMemo(
    () => [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Speaker",
    [profile]
  );

  async function loadPage() {
    setLoadingPage(true);
    setPageError("");
    try {
      const [meetingData, statusResponse, materialsResponse] = await Promise.all([
        getMeetings(),
        getSpeakerStatus(),
        listSpeakerMaterials(),
      ]);
      setMeetings(meetingData);
      setSpeakerStatus(statusResponse.data || emptyStatus);
      setMaterials(materialsResponse.data || []);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Unable to load speaker workspace.");
    } finally {
      setLoadingPage(false);
    }
  }

  async function toggleReady() {
    setSaving(true);
    setPageError("");
    setMessage("");
    try {
      const response = await saveSpeakerStatus({
        ...speakerStatus,
        is_ready: !Boolean(speakerStatus.is_ready),
      });
      setSpeakerStatus(response.data);
      setMessage("Speaker status saved.");
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Unable to save speaker status.");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    setSaving(true);
    setPageError("");
    setMessage("");
    try {
      const response = await saveSpeakerStatus(speakerStatus);
      setSpeakerStatus(response.data);
      setMessage("Speaker notes saved.");
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Unable to save notes.");
    } finally {
      setSaving(false);
    }
  }

  async function addMaterial() {
    if (!materialTitle.trim() || !materialUrl.trim()) return;

    setSaving(true);
    setPageError("");
    setMessage("");
    try {
      await createSpeakerMaterial({
        title: materialTitle.trim(),
        file_url: materialUrl.trim(),
        file_name: materialTitle.trim(),
      });
      setMaterialTitle("");
      setMaterialUrl("");
      const response = await listSpeakerMaterials();
      setMaterials(response.data || []);
      setMessage("Speaker material saved.");
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Unable to save material.");
    } finally {
      setSaving(false);
    }
  }

  async function startPreview() {
    setPreviewError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setPreviewStream(stream);
      setMicOn(true);
      setCameraOn(true);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Unable to access camera or microphone.");
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
    loadPage();
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = previewStream;
  }, [previewStream]);

  useEffect(() => {
    return () => previewStream?.getTracks().forEach((track) => track.stop());
  }, [previewStream]);

  const nextMeeting = meetings[0];
  const ready = Boolean(speakerStatus.is_ready);

  const controls = [
    { title: "Camera", desc: "Local camera preview before joining.", icon: Video, status: previewStream ? "Live" : "Ready" },
    { title: "Microphone", desc: "Mic permission and mute state are local.", icon: Mic, status: previewStream ? "Live" : "Ready" },
    { title: "Screen share", desc: "Available inside the live meeting room.", icon: MonitorUp, status: "Live room" },
    { title: "Approval", desc: `Current status: ${speakerStatus.approval_status}.`, icon: ShieldCheck, status: speakerStatus.approval_status },
  ];

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
              Prepare your session, <span className="telefya-text-gradient">{displayName}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-navy-500">
              Check your devices, manage readiness, save speaker materials, and join the next live room.
            </p>
          </div>

          <div className="rounded-xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">Speaker status</p>
            <strong className="mt-3 block text-3xl font-black text-navy-900">{ready ? "Ready" : "Not ready"}</strong>
            <p className="mt-2 text-sm font-semibold capitalize text-navy-500">
              Approval: {speakerStatus.approval_status}
            </p>
            <button
              onClick={toggleReady}
              disabled={saving}
              className={[
                "mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black shadow-soft disabled:opacity-50",
                ready ? "border border-border bg-white text-navy-800 hover:border-telefya-violet hover:text-telefya-violet" : "bg-telefya-blue text-white hover:bg-telefya-violet",
              ].join(" ")}
            >
              {saving ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
              {ready ? "Mark not ready" : "Mark ready"}
            </button>
          </div>
        </div>
      </section>

      {(profileError || pageError || previewError || message) ? (
        <div
          className={[
            "flex items-start gap-3 rounded-xl border p-4 text-sm font-bold",
            message && !profileError && !pageError && !previewError
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          {message && !profileError && !pageError && !previewError ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
          )}
          <span>{profileError || pageError || previewError || message}</span>
          {(profileError || pageError) ? (
            <button onClick={() => { reload(); loadPage(); }} className="ml-auto inline-flex items-center gap-2 underline">
              <RefreshCcw size={15} />
              Retry
            </button>
          ) : null}
        </div>
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
              <h2 className="text-xl font-black text-navy-900">Backstage preview</h2>
              <p className="mt-1 text-sm font-semibold text-navy-500">Test local camera and microphone before joining.</p>
            </div>
            <button
              onClick={previewStream ? stopPreview : startPreview}
              className={[
                "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-black shadow-soft",
                previewStream ? "border border-border bg-white text-navy-700 hover:border-red-200 hover:text-red-600" : "bg-telefya-blue text-white hover:bg-telefya-violet",
              ].join(" ")}
            >
              {previewStream ? <VideoOff size={16} /> : <Video size={16} />}
              {previewStream ? "Stop preview" : "Start preview"}
            </button>
          </div>

          <div className="p-5">
            <div className="relative overflow-hidden rounded-xl bg-navy-900">
              {previewStream ? (
                <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full bg-navy-900 object-cover" />
              ) : (
                <div className="grid aspect-video place-items-center text-white">
                  <div className="text-center">
                    <Video size={44} className="mx-auto text-white/55" />
                    <p className="mt-4 font-black">Camera preview</p>
                    <p className="mt-2 text-sm text-white/55">Start preview to check local media.</p>
                  </div>
                </div>
              )}
              <div className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1.5 text-xs font-black text-white backdrop-blur">
                {previewStream ? "Local preview" : "Preview off"}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <PreviewButton disabled={!previewStream} onClick={toggleMic} icon={micOn ? Mic : MicOff} label={micOn ? "Mic on" : "Mic off"} />
              <PreviewButton disabled={!previewStream} onClick={toggleCamera} icon={cameraOn ? Video : VideoOff} label={cameraOn ? "Camera on" : "Camera off"} />
              <PreviewButton disabled icon={ShieldCheck} label={speakerStatus.approval_status} />
            </div>
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-navy-900">Next session</h2>
            <p className="mt-1 text-sm font-semibold text-navy-500">Pulled from scheduled meetings.</p>

            {loadingPage ? (
              <LoadingRow label="Loading meetings..." />
            ) : nextMeeting ? (
              <div className="mt-5 rounded-xl bg-navy-50 p-4">
                <h3 className="font-black text-navy-900">{nextMeeting.des || "Telefya meeting"}</h3>
                <p className="mt-2 text-sm font-semibold text-navy-500">{getMeetingDateLabel(nextMeeting.time_zone)}</p>
                <p className="mt-3 break-all text-xs font-bold text-navy-300">{decodeStoredText(nextMeeting.meeting_url)}</p>
                <Link href={getRoomPath(nextMeeting.meeting_url)} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white shadow-soft hover:bg-telefya-violet">
                  <Video size={16} />
                  Join backstage
                </Link>
              </div>
            ) : (
              <EmptyState icon={MonitorUp} title="No speaker sessions yet" text="Create a meeting first, then it will appear here." />
            )}
          </section>

          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-navy-900">Speaker materials</h2>
            <p className="mt-1 text-sm font-semibold text-navy-500">Save slide links, documents, notes, or asset URLs.</p>

            <div className="mt-5 grid gap-3">
              <input
                value={materialTitle}
                onChange={(event) => setMaterialTitle(event.target.value)}
                placeholder="Material title"
                className="h-11 rounded-xl border border-border bg-navy-50 px-3 text-sm font-bold text-navy-800 outline-none focus:border-telefya-blue focus:bg-white"
              />
              <input
                value={materialUrl}
                onChange={(event) => setMaterialUrl(event.target.value)}
                placeholder="https://..."
                className="h-11 rounded-xl border border-border bg-navy-50 px-3 text-sm font-bold text-navy-800 outline-none focus:border-telefya-blue focus:bg-white"
              />
              <button
                onClick={addMaterial}
                disabled={saving || !materialTitle.trim() || !materialUrl.trim()}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white hover:bg-telefya-violet disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 size={17} className="animate-spin" /> : <FileUp size={17} />}
                Save material
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {materials.length === 0 ? (
                <EmptyState icon={FileUp} title="No materials yet" text="Saved speaker resources will appear here." />
              ) : (
                materials.map((item) => (
                  <a key={item.id} href={item.file_url || "#"} target="_blank" rel="noreferrer" className="rounded-xl bg-navy-50 px-4 py-3 hover:bg-blue-50">
                    <p className="font-black text-navy-900">{item.title}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-navy-400">{item.file_url || item.file_name}</p>
                  </a>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-white p-5 shadow-soft">
            <h2 className="text-xl font-black text-navy-900">Speaker notes</h2>
            <textarea
              value={speakerStatus.notes || ""}
              onChange={(event) => setSpeakerStatus((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Private prep notes..."
              className="mt-4 min-h-28 w-full rounded-xl border border-border bg-navy-50 p-3 text-sm font-semibold text-navy-700 outline-none focus:border-telefya-blue focus:bg-white"
            />
            <button onClick={saveNotes} disabled={saving} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-black text-navy-700 hover:border-telefya-blue hover:text-telefya-blue disabled:opacity-50">
              <Save size={16} />
              Save notes
            </button>
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
      <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black capitalize text-telefya-green">{status}</span>
    </article>
  );
}

function PreviewButton({ disabled, onClick, icon: Icon, label }: { disabled?: boolean; onClick?: () => void; icon: LucideIcon; label: string }) {
  return (
    <button disabled={disabled} onClick={onClick} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-black capitalize text-navy-700 hover:border-telefya-blue hover:text-telefya-blue disabled:cursor-not-allowed disabled:opacity-50">
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

function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-border bg-navy-50 p-5 text-center">
      <Icon size={30} className="mx-auto text-telefya-violet" />
      <p className="mt-3 font-black text-navy-900">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-navy-500">{text}</p>
    </div>
  );
}