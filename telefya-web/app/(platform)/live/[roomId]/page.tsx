"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronsRight,
  CircleStop,
  Copy,
  Globe2,
  Hand,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  PhoneOff,
  Radio,
  RefreshCw,
  ScreenShareOff,
  Send,
  ShieldCheck,
  Users,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LiveVideoTile } from "@/components/platform/live-video-tile";
import { getSavedUser } from "@/lib/auth/session";
import { useMediasoupRoom } from "@/hooks/use-mediasoup-room";

type RemoteStream = {
  id: string;
  kind: "audio" | "video";
  stream: MediaStream;
  userId?: string;
  userName?: string;
  isScreen?: boolean;
  micOn?: boolean;
  cameraOn?: boolean;
};

type ParticipantMeta = {
  userId?: string;
  id?: string;
  userName?: string;
  name?: string;
  micOn?: boolean;
  cameraOn?: boolean;
  isHost?: boolean;
};

type StageTile = {
  id: string;
  userId?: string;
  name: string;
  stream?: MediaStream;
  muted?: boolean;
  cameraOn?: boolean;
  micOn?: boolean;
  isScreen?: boolean;
  isSelf?: boolean;
};

type ChatMessage = {
  roomId?: string;
  message: string;
  time?: string;
  userName: string;
  socketId?: string;
  messageId?: string;
};

type BillingNotice = {
  type: "warning" | "error" | "ended";
  title: string;
  message: string;
  code?: string;
  upgrade?: boolean;
};

function formatElapsed(startedAt?: string | null) {
  if (!startedAt) return "00:00";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
  );

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours) {
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0",
    )}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getGalleryClass(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 md:grid-cols-2";
  if (count <= 4) return "grid-cols-1 md:grid-cols-2";
  return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeParticipants(value: unknown): ParticipantMeta[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value as ParticipantMeta[];
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, ParticipantMeta>);
  }

  return [];
}

export default function LiveRoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = decodeURIComponent(params.roomId);

  const [started, setStarted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [recordingAction, setRecordingAction] = useState(false);
  const [localRecordingNotice, setLocalRecordingNotice] = useState("");
  const [billingNotice, setBillingNotice] = useState<BillingNotice | null>(
    null,
  );
  const [user, setUser] = useState(getSavedUser());

  useEffect(() => {
    setUser(getSavedUser());
  }, []);

  const userName = useMemo(
    () =>
      [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
      user?.email ||
      "Telefya user",
    [user],
  );

  const userId = user?.user_id || user?.id || user?.email || "guest-user";

  const room = useMediasoupRoom({
    enabled: started,
    roomId,
    userId,
    userName,
    isHost,
  });

  const roomSocket = (room as any).socket;

  const handRaised = Boolean(room.raisedHands?.[userId]);
  const raisedHandCount = Object.keys(room.raisedHands || {}).length;
  const [recordingElapsed, setRecordingElapsed] = useState("00:00");

  useEffect(() => {
    if (!roomSocket?.on || !roomSocket?.off) return;

    function handleBillingDenied(payload: any) {
      const code = payload?.code || "";

      setBillingNotice({
        type: "error",
        title:
          code === "PLAN_RECORDING_DISABLED"
            ? "Recording requires an upgrade"
            : "Plan limit reached",
        message:
          payload?.message || "Your current plan does not allow this action.",
        code,
        upgrade: true,
      });
    }

    function handleMeetingWarning(payload: any) {
      setBillingNotice({
        type: "warning",
        title: "Meeting time limit",
        message:
          payload?.message ||
          "This meeting is close to the time limit for your plan.",
        code: payload?.code,
        upgrade: true,
      });
    }

    function handleMeetingEnded(payload: any) {
      setBillingNotice({
        type: "ended",
        title: "Meeting ended",
        message:
          payload?.message ||
          "This meeting has ended because it reached the limit for your plan.",
        code: payload?.code,
        upgrade: true,
      });
    }

    roomSocket.on("billing:limit-denied", handleBillingDenied);
    roomSocket.on("billing:meeting-warning", handleMeetingWarning);
    roomSocket.on("billing:meeting-ended", handleMeetingEnded);

    return () => {
      roomSocket.off("billing:limit-denied", handleBillingDenied);
      roomSocket.off("billing:meeting-warning", handleMeetingWarning);
      roomSocket.off("billing:meeting-ended", handleMeetingEnded);
    };
  }, [roomSocket]);

  useEffect(() => {
    if (!room.recording || !room.recordingStartedAt) {
      setRecordingElapsed("00:00");
      return;
    }

    const update = () =>
      setRecordingElapsed(formatElapsed(room.recordingStartedAt));

    update();

    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [room.recording, room.recordingStartedAt]);

  const videoStreams = room.remoteStreams.filter(
    (stream) => stream.kind === "video",
  ) as RemoteStream[];

  const audioStreams = room.remoteStreams.filter(
    (stream) => stream.kind === "audio",
  ) as RemoteStream[];

  const participantMeta = normalizeParticipants(
    (room as any).participants ||
      (room as any).participantStates ||
      (room as any).participantMap,
  );

  const participantById = useMemo(() => {
    const map = new Map<string, ParticipantMeta>();

    for (const participant of participantMeta) {
      const id = participant.userId || participant.id;
      if (!id) continue;
      map.set(String(id), participant);
    }

    return map;
  }, [participantMeta]);

  const localTile = room.localStream
    ? {
        id: "local-user",
        userId,
        name: `${userName} (You)`,
        stream: room.localStream,
        muted: true,
        cameraOn: room.cameraOn,
        micOn: room.micOn,
        isSelf: true,
      }
    : null;

  const remoteUserIds = new Set<string>();

  for (const stream of [...videoStreams, ...audioStreams]) {
    if (stream.userId) remoteUserIds.add(String(stream.userId));
  }

  for (const participant of participantMeta) {
    const id = participant.userId || participant.id;
    if (id && String(id) !== String(userId)) {
      remoteUserIds.add(String(id));
    }
  }

  const remoteTiles = Array.from(remoteUserIds).map((remoteUserId) => {
    const participant = participantById.get(remoteUserId);
    const videoStream = videoStreams.find(
      (stream) => String(stream.userId || stream.id) === remoteUserId,
    );
    const audioStream = audioStreams.find(
      (stream) => String(stream.userId || stream.id) === remoteUserId,
    );

    const name =
      videoStream?.userName ||
      audioStream?.userName ||
      participant?.userName ||
      participant?.name ||
      "Participant";

    const inferredMicOn = Boolean(audioStream);
    const inferredCameraOn = Boolean(videoStream);

    return {
      id: videoStream?.id || audioStream?.id || remoteUserId,
      userId: remoteUserId,
      name,
      stream: videoStream?.stream,
      isScreen: videoStream?.isScreen,
      cameraOn:
        typeof participant?.cameraOn === "boolean"
          ? participant.cameraOn
          : typeof videoStream?.cameraOn === "boolean"
            ? videoStream.cameraOn
            : inferredCameraOn,
      micOn:
        typeof participant?.micOn === "boolean"
          ? participant.micOn
          : typeof audioStream?.micOn === "boolean"
            ? audioStream.micOn
            : inferredMicOn,
      isSelf: false,
    } satisfies StageTile;
  });

  const screenTile = remoteTiles.find((tile) => tile.isScreen) || null;
  const remotePersonTiles = remoteTiles.filter((tile) => !tile.isScreen);

  const mainTiles = screenTile
    ? [screenTile]
    : remotePersonTiles.length
      ? remotePersonTiles.slice(0, 9)
      : localTile
        ? [localTile]
        : [];

  const sideTiles = screenTile
    ? [localTile, ...remotePersonTiles].filter(Boolean).slice(0, 7)
    : [];

  const showSelfPreview = Boolean(
    !screenTile && remotePersonTiles.length > 0 && localTile,
  );

  const allParticipantTiles = [
    localTile,
    ...remotePersonTiles,
    ...(screenTile ? [screenTile] : []),
  ].filter(Boolean) as StageTile[];

  const participantCount = Math.max(1, allParticipantTiles.length);
  const recordingReady = room.connected && Boolean(room.localStream);

  async function copyRoomLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function startAsHost() {
    setBillingNotice(null);
    setIsHost(true);
    setStarted(true);
    setExpanded(true);
    setChatOpen(true);
  }

  function joinAsParticipant() {
    setBillingNotice(null);
    setIsHost(false);
    setStarted(true);
    setExpanded(true);
    setChatOpen(true);
  }

  async function toggleRecording() {
    if (recordingAction) return;

    if (!room.recording && !recordingReady) {
      setLocalRecordingNotice(
        "Meeting media is still starting. Please wait a few seconds, then record.",
      );
      window.setTimeout(() => setLocalRecordingNotice(""), 3500);
      return;
    }

    setRecordingAction(true);
    setLocalRecordingNotice("");

    try {
      if (room.recording) {
        await room.stopRecording();
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 1200));
        await room.startRecording();
      }
    } finally {
      setRecordingAction(false);
    }
  }

  function leaveRoom() {
    room.leave();
    window.location.href = "/lobby";
  }

  if (!started) {
    return (
      <main className="min-h-[calc(100vh-68px)]">
        <section className="telefya-aurora overflow-hidden rounded-xl border border-border bg-white shadow-enterprise">
          <div className="telefya-accent-line h-1" />

          <div className="grid gap-8 p-6 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <Image
                src="/images/telefya-logo.png"
                alt="Telefya"
                width={166}
                height={50}
                priority
                className="h-11 w-auto"
              />

              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-navy-500 shadow-soft">
                <Radio size={15} className="text-telefya-violet" />
                Live stage
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight text-navy-900">
                Join a secure{" "}
                <span className="telefya-text-gradient">Telefya meeting</span>
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-navy-500">
                Start as host to open the room, or join as a participant after
                the host has started the session.
              </p>

              <div className="mt-6 rounded-xl border border-border bg-white/85 p-4 shadow-soft backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
                  Room ID
                </p>
                <p className="mt-2 break-all text-sm font-black text-navy-900">
                  {roomId}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5 shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
                Pre-join
              </p>

              <h2 className="mt-2 text-2xl font-black text-navy-900">
                Choose how to enter
              </h2>

              <div className="mt-6 grid gap-3">
                <button
                  onClick={startAsHost}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-5 text-sm font-black text-white shadow-soft hover:bg-telefya-violet"
                >
                  <Radio size={17} />
                  Start meeting as host
                </button>

                <button
                  onClick={joinAsParticipant}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-black text-navy-800 hover:border-telefya-blue hover:text-telefya-blue"
                >
                  <Video size={17} />
                  Join as participant
                </button>

                <button
                  onClick={copyRoomLink}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-navy-50 px-5 text-sm font-black text-navy-700 hover:border-telefya-green hover:text-telefya-green"
                >
                  {copied ? <CheckCircle2 size={17} /> : <Copy size={17} />}
                  {copied ? "Copied" : "Copy room link"}
                </button>
              </div>

              <div className="mt-5 grid gap-2 rounded-xl bg-navy-50 p-4">
                <StatusLine label="Identity" value={userName} />
                <StatusLine label="Access" value="Authenticated" />
                <StatusLine label="Media" value="Camera and mic after entry" />
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      className={[
        expanded ? "fixed inset-0 z-50" : "h-[calc(100vh-68px)]",
        "grid overflow-hidden bg-[#060b1f]",
      ].join(" ")}
    >
      <section className="relative flex min-h-0 flex-col overflow-hidden bg-[#060b1f]">
        <header className="flex h-[68px] shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4">
          <div className="flex min-w-0 items-center gap-4">
            <Image
              src="/images/telefya-logo.png"
              alt="Telefya"
              width={142}
              height={43}
              priority
              className="h-9 w-auto shrink-0"
            />

            <div className="hidden min-w-0 border-l border-white/10 pl-4 sm:block">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                Live Stage
              </p>
              <h1 className="truncate text-sm font-black text-white">
                {roomId}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TopPill
              icon={room.connected ? ShieldCheck : Loader2}
              label={room.connected ? "Secure" : "Connecting"}
              spin={!room.connected}
            />

            <IconPill icon={Users} label={`${participantCount} people`} />
            <IconPill icon={RefreshCw} label="Sync" />
            <IconPill icon={Globe2} label="Workspace" />

            {raisedHandCount > 0 ? (
              <IconPill
                icon={Hand}
                label={`${raisedHandCount} raised`}
                tone="amber"
              />
            ) : null}

            {room.recording ? (
              <span className="inline-flex h-9 items-center gap-2 rounded-full bg-red-500/15 px-3 text-xs font-black text-red-100 ring-1 ring-red-400/25">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                REC {recordingElapsed}
              </span>
            ) : null}
          </div>
        </header>

        {room.error || room.recordingError || billingNotice ? (
          <div className="mx-4 mt-3 grid gap-2">
            {room.error ? (
              <NoticeBanner type="error" message={room.error} />
            ) : null}

            {room.recordingError ? (
              <NoticeBanner type="error" message={room.recordingError} />
            ) : null}

            {billingNotice ? (
              <BillingNoticeBanner
                notice={billingNotice}
                onClose={() => setBillingNotice(null)}
              />
            ) : null}
          </div>
        ) : null}

        <div
          className={[
            "grid min-h-0 flex-1 gap-3 bg-black p-2 pb-28",
            chatOpen ? "xl:grid-cols-[minmax(0,1fr)_320px]" : "xl:grid-cols-1",
          ].join(" ")}
        >
          <div
            className={[
              "relative grid min-h-0 gap-1.5",
              screenTile
                ? "xl:grid-cols-[minmax(0,1fr)_230px]"
                : getGalleryClass(mainTiles.length),
            ].join(" ")}
          >
            {mainTiles.length ? (
              mainTiles.map((tile) => (
                <StageTileView
                  key={tile.id}
                  tile={tile}
                  recording={room.recording}
                />
              ))
            ) : (
              <div className="grid min-h-[420px] place-items-center rounded-xl bg-[#0a1636] text-white">
                <div className="flex items-center gap-3 text-sm font-black">
                  <Loader2
                    className="animate-spin text-telefya-blue"
                    size={20}
                  />
                  Preparing camera...
                </div>
              </div>
            )}

            {screenTile && sideTiles.length ? (
              <aside className="hidden min-h-0 content-start gap-2 overflow-y-auto xl:grid">
                {sideTiles.map((tile) =>
                  tile ? (
                    <StageTileView key={tile.id} tile={tile} compact />
                  ) : null,
                )}
              </aside>
            ) : null}

            {showSelfPreview && localTile ? (
              <div className="absolute bottom-5 right-5 z-20 hidden w-[220px] overflow-hidden rounded-xl border border-white/15 bg-black shadow-2xl xl:block">
                <StageTileView tile={localTile} compact />
              </div>
            ) : null}

            <div className="hidden">
              {audioStreams.map((stream) => (
                <LiveAudioTrack key={stream.id} stream={stream.stream} />
              ))}
            </div>
          </div>

          {chatOpen ? (
            <EmbeddedChatPanel
              messages={room.messages as ChatMessage[]}
              onSend={room.sendMessage}
              onClose={() => setChatOpen(false)}
            />
          ) : null}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-36 bg-gradient-to-t from-black/55 to-transparent" />

        <div className="absolute inset-x-0 bottom-6 z-30 flex justify-center px-4">
          <div className="flex items-center gap-3">
            <DockButton
              active={chatOpen}
              icon={MessageSquare}
              label="Chat"
              onClick={() => setChatOpen((value) => !value)}
            />

            <DockButton
              active={!room.micOn}
              danger={!room.micOn}
              icon={room.micOn ? Mic : MicOff}
              label={room.micOn ? "Mute" : "Unmute"}
              onClick={room.toggleMic}
            />

            <DockButton
              active={!room.cameraOn}
              danger={!room.cameraOn}
              icon={room.cameraOn ? Video : VideoOff}
              label={room.cameraOn ? "Stop video" : "Start video"}
              onClick={room.toggleCamera}
            />

            <DockButton
              active={room.screenOn}
              icon={room.screenOn ? ScreenShareOff : MonitorUp}
              label={room.screenOn ? "Stop sharing" : "Share screen"}
              onClick={room.toggleScreenShare}
            />

            <div className="relative">
              <DockButton
                active={participantsOpen}
                icon={Users}
                label="Participants"
                onClick={() => {
                  setMoreOpen(false);
                  setParticipantsOpen((value) => !value);
                }}
              />

              {participantsOpen ? (
                <div className="absolute bottom-[76px] left-1/2 w-[260px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-white p-2 text-navy-900 shadow-enterprise">
                  <p className="px-2 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-navy-400">
                    Participants ({participantCount})
                  </p>

                  <div className="mt-1 grid max-h-64 gap-1 overflow-y-auto">
                    {allParticipantTiles.map((tile) => (
                      <div
                        key={tile.id}
                        className="flex items-center gap-3 rounded-xl px-2 py-2"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy-50 text-xs font-black text-navy-700">
                          {getInitials(tile.name)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-bold text-navy-800">
                          {tile.name}
                        </span>
                        {tile.micOn === false ? (
                          <MicOff
                            size={14}
                            className="shrink-0 text-navy-300"
                          />
                        ) : (
                          <Mic
                            size={14}
                            className="shrink-0 text-emerald-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <DockButton
                active={moreOpen}
                icon={MoreHorizontal}
                label="More"
                onClick={() => {
                  setParticipantsOpen(false);
                  setMoreOpen((value) => !value);
                }}
              />

              {moreOpen ? (
                <div className="absolute bottom-[76px] left-1/2 w-[292px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-white p-2 text-navy-900 shadow-enterprise">
                  {isHost ? (
                    <MenuAction
                      disabled={
                        recordingAction || (!room.recording && !recordingReady)
                      }
                      danger={room.recording}
                      icon={room.recording ? CircleStop : Radio}
                      label={
                        recordingAction
                          ? room.recording
                            ? "Stopping..."
                            : "Starting..."
                          : room.recording
                            ? "Stop recording"
                            : "Start recording"
                      }
                      caption={
                        room.recording
                          ? "Finalize and send to Analytics"
                          : recordingReady
                            ? "Record clean meeting stage"
                            : "Waiting for meeting media"
                      }
                      onClick={() => {
                        setMoreOpen(false);
                        toggleRecording();
                      }}
                    />
                  ) : null}

                  <MenuAction
                    active={handRaised}
                    icon={Hand}
                    label={handRaised ? "Lower hand" : "Raise hand"}
                    caption="Signal the host"
                    onClick={() => {
                      setMoreOpen(false);
                      room.toggleHand();
                    }}
                  />

                  <MenuAction
                    icon={expanded ? Minimize2 : Maximize2}
                    label={expanded ? "Exit focus mode" : "Focus mode"}
                    caption="Scale the meeting stage"
                    onClick={() => {
                      setMoreOpen(false);
                      setExpanded((value) => !value);
                    }}
                  />

                  <MenuAction
                    active={copied}
                    icon={copied ? CheckCircle2 : Copy}
                    label={copied ? "Invite copied" : "Copy invite"}
                    caption="Share this room link"
                    onClick={() => {
                      setMoreOpen(false);
                      copyRoomLink();
                    }}
                  />
                </div>
              ) : null}
            </div>

            <DockButton
              danger
              icon={PhoneOff}
              label="Leave"
              onClick={leaveRoom}
            />
          </div>
        </div>

        {room.recordingNotice ? (
          <Toast type="success">
            <p>{room.recordingNotice}</p>
            <Link
              href="/analytics"
              className="mt-1 inline-flex text-[11px] underline underline-offset-2"
            >
              View recordings
            </Link>
          </Toast>
        ) : null}

        {localRecordingNotice ? (
          <Toast type="warning">{localRecordingNotice}</Toast>
        ) : null}
      </section>
    </main>
  );
}

function EmbeddedChatPanel({
  messages,
  onSend,
  onClose,
}: {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const clean = draft.trim();
    if (!clean) return;

    onSend(clean);
    setDraft("");
  }

  return (
    <aside className="hidden min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1734] text-white shadow-2xl xl:flex xl:flex-col">
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-5">
        <h2 className="text-2xl font-black">Chat</h2>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            title="Collapse chat"
          >
            <ChevronsRight size={16} />
          </button>

          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            title="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <p className="text-sm font-bold leading-6 text-white/45">
            Meeting messages appear here.
          </p>
        ) : (
          <div className="grid gap-4">
            {messages.map((message, index) => (
              <div
                key={
                  message.messageId || `${message.socketId || "msg"}-${index}`
                }
                className="grid gap-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[11px] font-black text-white">
                    {getInitials(message.userName || "Participant")}
                  </span>
                  <span className="min-w-0 truncate text-sm font-black text-white/90">
                    {message.userName || "Participant"}
                  </span>
                  {message.time ? (
                    <span className="text-xs font-bold text-white/35">
                      {message.time}
                    </span>
                  ) : null}
                </div>

                <div className="ml-9 rounded-xl bg-white/8 px-4 py-3 text-sm font-semibold leading-6 text-white/75">
                  {message.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="shrink-0 border-t border-white/10 p-4">
        <div className="flex h-12 items-center gap-2 rounded-xl bg-white/8 px-3">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message..."
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/35"
          />

          <button
            type="submit"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-telefya-blue text-white hover:bg-telefya-violet"
            title="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </aside>
  );
}

function StageTileView({
  tile,
  compact,
  recording,
}: {
  tile: StageTile;
  compact?: boolean;
  recording?: boolean;
}) {
  const showVideo = Boolean(tile.stream && tile.cameraOn !== false);

  return (
    <div
      className={[
        "relative min-h-0 overflow-hidden rounded-md bg-black ring-1 ring-white/5",
        compact ? "aspect-video" : "min-h-[220px]",
      ].join(" ")}
    >
      {recording ? (
        <div className="absolute left-3 top-3 z-20 inline-flex items-center gap-2 rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-black text-white shadow-soft">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          REC
        </div>
      ) : null}

      {showVideo ? (
        <LiveVideoTile
          stream={tile.stream as MediaStream}
          name={tile.name}
          muted={tile.muted}
          cameraOn={tile.cameraOn}
          micOn={tile.micOn}
          isScreen={tile.isScreen}
        />
      ) : (
        <AvatarTile tile={tile} compact={compact} />
      )}

      <div className="absolute bottom-3 left-3 z-20 flex max-w-[calc(100%-24px)] items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-black text-white backdrop-blur-md">
        <span className="truncate">{tile.name}</span>
        {tile.micOn === false ? (
          <MicOff size={13} className="shrink-0 text-red-200" />
        ) : (
          <Mic size={13} className="shrink-0 text-emerald-300" />
        )}
      </div>

      {tile.cameraOn === false ? (
        <div className="absolute right-3 top-3 z-20 rounded-full bg-black/55 p-2 text-white/80 backdrop-blur-md">
          <VideoOff size={14} />
        </div>
      ) : null}
    </div>
  );
}

function AvatarTile({ tile, compact }: { tile: StageTile; compact?: boolean }) {
  return (
    <div className="grid h-full min-h-[180px] place-items-center bg-[#07122d] text-white">
      <div className="grid place-items-center text-center">
        <div
          className={[
            "telefya-gradient grid place-items-center rounded-full font-black text-white shadow-2xl",
            compact ? "h-16 w-16 text-xl" : "h-28 w-28 text-4xl",
          ].join(" ")}
        >
          {getInitials(tile.name)}
        </div>
        <p
          className={[
            "mt-4 max-w-[220px] truncate font-black text-white",
            compact ? "text-sm" : "text-xl",
          ].join(" ")}
        >
          {tile.name}
        </p>
        <p className="mt-1 text-xs font-bold text-white/45">Camera off</p>
      </div>
    </div>
  );
}

function TopPill({
  icon: Icon,
  label,
  spin,
}: {
  icon: LucideIcon;
  label: string;
  spin?: boolean;
}) {
  return (
    <span className="inline-flex h-9 items-center gap-2 rounded-full bg-emerald-500/12 px-3 text-xs font-black text-emerald-100 ring-1 ring-emerald-400/20">
      <Icon size={14} className={spin ? "animate-spin" : ""} />
      {label}
    </span>
  );
}

function IconPill({
  icon: Icon,
  label,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  tone?: "amber";
}) {
  return (
    <span
      title={label}
      className={[
        "grid h-9 w-9 place-items-center rounded-full ring-1",
        tone === "amber"
          ? "bg-amber-500/15 text-amber-100 ring-amber-400/25"
          : "bg-white/5 text-white/80 ring-white/10",
      ].join(" ")}
    >
      <Icon size={16} />
    </span>
  );
}

function Toast({
  type,
  children,
}: {
  type: "success" | "warning";
  children: ReactNode;
}) {
  const dot = {
    success: "bg-emerald-400",
    warning: "bg-amber-400",
  };

  const textTone = {
    success: "text-emerald-50",
    warning: "text-amber-50",
  };

  return (
    <div
      className={[
        "absolute right-5 top-[84px] z-40 flex max-w-xs items-start gap-3 rounded-lg border border-white/10 bg-[#0c1734]/95 px-4 py-3 text-xs font-semibold shadow-lg backdrop-blur-xl",
        textTone[type],
      ].join(" ")}
    >
      <span
        className={["mt-1 h-1.5 w-1.5 shrink-0 rounded-full", dot[type]].join(
          " ",
        )}
      />
      <div className="leading-5">{children}</div>
    </div>
  );
}

function BillingNoticeBanner({
  notice,
  onClose,
}: {
  notice: BillingNotice;
  onClose: () => void;
}) {
  const isWarning = notice.type === "warning";

  return (
    <div
      className={[
        "flex items-start justify-between gap-4 rounded-xl px-4 py-3 text-sm font-bold",
        isWarning
          ? "border border-amber-300/40 bg-amber-500/15 text-amber-100"
          : "border border-red-300/40 bg-red-500/15 text-red-100",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start gap-3">
        <AlertCircle size={17} className="mt-0.5 shrink-0" />

        <div className="min-w-0">
          <p className="font-black">{notice.title}</p>
          <p className="mt-1 leading-6 opacity-90">{notice.message}</p>

          {notice.upgrade ? (
            <Link
              href="/choose-plan?plan=pro"
              className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-white px-4 text-xs font-black text-navy-900 transition hover:bg-blue-50 hover:text-telefya-blue"
            >
              Upgrade plan
            </Link>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close billing notice"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-current opacity-70 transition hover:bg-white/10 hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function NoticeBanner({
  type,
  message,
  children,
}: {
  type: "error" | "success";
  message: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={[
        "flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-bold",
        type === "error"
          ? "border border-red-300/40 bg-red-500/15 text-red-100"
          : "border border-emerald-300/40 bg-emerald-500/15 text-emerald-100",
      ].join(" ")}
    >
      {type === "error" ? (
        <AlertCircle size={17} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
      )}
      <span>{message}</span>
      {children}
    </div>
  );
}

function DockButton({
  active,
  danger,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  danger?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={[
        "grid h-14 w-14 shrink-0 place-items-center rounded-full shadow-lg transition",
        danger
          ? "bg-red-500 text-white hover:bg-red-600"
          : active
            ? "bg-telefya-blue text-white"
            : "bg-white/10 text-white/85 backdrop-blur-md hover:bg-white/20 hover:text-white",
      ].join(" ")}
    >
      <Icon size={20} />
    </button>
  );
}

function MenuAction({
  active,
  danger,
  disabled,
  icon: Icon,
  label,
  caption,
  onClick,
}: {
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  caption: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex w-full items-center gap-3 rounded-xl p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-45",
        danger
          ? "text-red-600 hover:bg-red-50"
          : active
            ? "bg-blue-50 text-telefya-blue"
            : "text-navy-800 hover:bg-navy-50",
      ].join(" ")}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-current/10">
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black">{label}</span>
        <span className="mt-0.5 block text-xs font-semibold text-navy-400">
          {caption}
        </span>
      </span>
    </button>
  );
}

function LiveAudioTrack({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.srcObject = stream;
  }, [stream]);

  return <audio ref={ref} autoPlay playsInline />;
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-navy-300">
        {label}
      </span>
      <span className="max-w-[190px] truncate text-sm font-black text-navy-800">
        {value}
      </span>
    </div>
  );
}
