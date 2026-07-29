"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  Ban,
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
  Palette,
  PhoneOff,
  Plus,
  Radio,
  RefreshCw,
  ScreenShareOff,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
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
import {
  isVirtualBackgroundSupported,
  type VirtualBackground,
} from "@/lib/media/virtual-background";

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

function RoomStyles() {
  return (
    <style jsx global>{`
      .telefya-mesh-bg {
        background-color: #060b1f;
      }
      .telefya-stage-bg {
        background-color: #0a1636;
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
          linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.045) 1px,
            transparent 1px
          ),
          radial-gradient(
            circle at 50% -10%,
            rgba(59, 130, 246, 0.18),
            transparent 55%
          );
        background-size:
          34px 34px,
          34px 34px,
          100% 100%;
      }
      .telefya-rail {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .telefya-rail::-webkit-scrollbar {
        display: none;
      }
    `}</style>
  );
}

type BackgroundOption = {
  id: string;
  label: string;
  value: VirtualBackground;
  removable?: boolean;
};

const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: "none", label: "None", value: { type: "none" } },
  {
    id: "blur-light",
    label: "Light blur",
    value: { type: "blur", intensity: "light" },
  },
  {
    id: "blur",
    label: "Blur",
    value: { type: "blur", intensity: "medium" },
  },
  {
    id: "blur-strong",
    label: "Strong blur",
    value: { type: "blur", intensity: "strong" },
  },
  {
    id: "office",
    label: "Office",
    value: {
      type: "image",
      url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1280&q=85",
    },
  },
  {
    id: "studio",
    label: "Studio",
    value: {
      type: "image",
      url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1280&q=85",
    },
  },
  {
    id: "backdrop-1",
    label: "Backdrop 1",
    value: {
      type: "image",
      url: "https://picsum.photos/seed/telefya-backdrop-1/1280/800",
    },
  },
  {
    id: "backdrop-2",
    label: "Backdrop 2",
    value: {
      type: "image",
      url: "https://picsum.photos/seed/telefya-backdrop-2/1280/800",
    },
  },
  {
    id: "backdrop-3",
    label: "Backdrop 3",
    value: {
      type: "image",
      url: "https://picsum.photos/seed/telefya-backdrop-3/1280/800",
    },
  },
  {
    id: "backdrop-4",
    label: "Backdrop 4",
    value: {
      type: "image",
      url: "https://picsum.photos/seed/telefya-backdrop-4/1280/800",
    },
  },
  {
    id: "backdrop-5",
    label: "Backdrop 5",
    value: {
      type: "image",
      url: "https://picsum.photos/seed/telefya-backdrop-5/1280/800",
    },
  },
  {
    id: "backdrop-6",
    label: "Backdrop 6",
    value: {
      type: "image",
      url: "https://picsum.photos/seed/telefya-backdrop-6/1280/800",
    },
  },
];

const CUSTOM_BACKGROUNDS_STORAGE_KEY = "telefya:customBackgrounds";

function loadStoredCustomBackgrounds(): BackgroundOption[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CUSTOM_BACKGROUNDS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is BackgroundOption =>
        item &&
        typeof item.id === "string" &&
        typeof item.label === "string" &&
        item.value?.type === "image" &&
        typeof item.value.url === "string",
    );
  } catch {
    return [];
  }
}

function persistCustomBackgrounds(backgrounds: BackgroundOption[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      CUSTOM_BACKGROUNDS_STORAGE_KEY,
      JSON.stringify(backgrounds),
    );
  } catch {
  
  }
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
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenCountRef = useRef(0);

  const [pendingBackgroundId, setPendingBackgroundId] = useState<string | null>(
    null,
  );

  const [selectedBackground, setSelectedBackground] =
    useState<VirtualBackground>({ type: "none" });

  const [selectedBackgroundId, setSelectedBackgroundId] = useState("none");

  const [customBackgrounds, setCustomBackgrounds] = useState<
    BackgroundOption[]
  >([]);

  useEffect(() => {
    setCustomBackgrounds(loadStoredCustomBackgrounds());
  }, []);

  const allBackgroundOptions = useMemo(
    () => [...BACKGROUND_OPTIONS, ...customBackgrounds],
    [customBackgrounds],
  );

  const backgroundsSupported = useMemo(
    () => isVirtualBackgroundSupported(),
    [],
  );

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
  virtualBackground: selectedBackground,
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

  useEffect(() => {
    const total = room.messages.length;

    if (chatOpen) {
      lastSeenCountRef.current = total;
      setUnreadCount(0);
      return;
    }

    setUnreadCount(Math.max(0, total - lastSeenCountRef.current));
  }, [room.messages.length, chatOpen]);

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

  const localScreenTile =
    room.screenOn && room.screenStream
      ? {
          id: "local-screen",
          userId,
          name: `${userName} (You) — Presenting`,
          stream: room.screenStream,
          isScreen: true,
          cameraOn: true,
          micOn: undefined,
          isSelf: true,
        }
      : null;

  const cameraVideoStreams = videoStreams.filter((stream) => !stream.isScreen);
  const remoteScreenStreams = videoStreams.filter(
    (stream) => stream.isScreen && String(stream.userId) !== String(userId),
  );

  const remoteUserIds = new Set<string>();

  for (const stream of [...cameraVideoStreams, ...audioStreams]) {
    if (stream.userId) remoteUserIds.add(String(stream.userId));
  }

  for (const participant of participantMeta) {
    const id = participant.userId || participant.id;
    if (id && String(id) !== String(userId)) {
      remoteUserIds.add(String(id));
    }
  }

  const remotePersonTiles = Array.from(remoteUserIds).map((remoteUserId) => {
    const participant = participantById.get(remoteUserId);
    const videoStream = cameraVideoStreams.find(
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
      isScreen: false,
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

  const remoteScreenTiles = remoteScreenStreams.map((stream) => {
    const participant = stream.userId
      ? participantById.get(String(stream.userId))
      : undefined;

    const presenterName =
      stream.userName || participant?.userName || participant?.name || "Someone";

    return {
      id: stream.id,
      userId: stream.userId,
      name: `${presenterName} — Presenting`,
      stream: stream.stream,
      isScreen: true,
      cameraOn: true,
      micOn: undefined,
      isSelf: false,
    } satisfies StageTile;
  });

  const screenTile: StageTile | null =
    localScreenTile || remoteScreenTiles[0] || null;
  const overflowScreenTiles = remoteScreenTiles.filter(
    (tile) => tile.id !== screenTile?.id,
  );

  const primaryTile: StageTile | null =
    screenTile || remotePersonTiles[0] || localTile || null;

  const railTiles = [
    ...(localTile && primaryTile && localTile.id !== primaryTile.id
      ? [localTile]
      : []),
    ...remotePersonTiles.filter((tile) =>
      primaryTile ? tile.id !== primaryTile.id : true,
    ),
    ...overflowScreenTiles,
  ].filter(Boolean) as StageTile[];

  const allParticipantTiles = [
    localTile,
    ...remotePersonTiles,
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

async function chooseBackground(
  background: VirtualBackground,
  id: string,
) {
  if (pendingBackgroundId) return;

  setPendingBackgroundId(id);

  try {
    await room.setVirtualBackground(background);
    setSelectedBackground(background);
    setSelectedBackgroundId(id);
  } finally {
    setPendingBackgroundId(null);
  }
}

  function addCustomBackground() {
    const url = window.prompt(
      "Paste an image URL to use as a background.\n\nTip: the image host must allow cross-origin access (most photo/CDN hosts do) or the background will fail to load.",
    );

    const trimmed = url?.trim();
    if (!trimmed) return;

    if (!/^https?:\/\//i.test(trimmed)) {
      window.alert("Please enter a full image URL starting with http(s)://");
      return;
    }

    const option: BackgroundOption = {
      id: `custom-${Date.now()}`,
      label: "Custom",
      value: { type: "image", url: trimmed },
      removable: true,
    };

    setCustomBackgrounds((current) => {
      const next = [...current, option];
      persistCustomBackgrounds(next);
      return next;
    });
  }

  function removeCustomBackground(id: string) {
    setCustomBackgrounds((current) => {
      const next = current.filter((item) => item.id !== id);
      persistCustomBackgrounds(next);
      return next;
    });

    if (selectedBackgroundId === id) {
      void chooseBackground({ type: "none" }, "none");
    }
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
        <RoomStyles />

        <section className="telefya-aurora telefya-in-scale overflow-hidden rounded-xl border border-border bg-white shadow-enterprise">
          <div className="telefya-accent-line h-1" />

          <div className="grid gap-6 p-4 sm:gap-8 sm:p-6 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <Image
                src="/images/telefya-logo.png"
                alt="Telefya"
                width={166}
                height={50}
                priority
                className="h-9 w-auto sm:h-11"
              />

              <div className="telefya-in-fade-up telefya-stagger-1 mt-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-navy-500 shadow-soft sm:mt-8">
                <Radio size={15} className="text-telefya-violet" />
                Live stage
              </div>

              <h1 className="telefya-in-fade-up telefya-stagger-2 mt-5 max-w-3xl text-3xl font-black leading-tight text-navy-900 sm:mt-6 sm:text-4xl">
                Join a secure{" "}
                <span className="telefya-text-gradient">Telefya meeting</span>
              </h1>

              <p className="telefya-in-fade-up telefya-stagger-3 mt-4 max-w-2xl text-sm leading-7 text-navy-500 sm:text-base sm:leading-8">
                Start as host to open the room, or join as a participant after
                the host has started the session.
              </p>

              <div className="telefya-in-fade-up telefya-stagger-4 mt-6 rounded-xl border border-border bg-white/85 p-4 shadow-soft backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
                  Room ID
                </p>
                <p className="mt-2 break-all text-sm font-black text-navy-900">
                  {roomId}
                </p>
              </div>
            </div>

            <div className="telefya-in-right telefya-stagger-2 rounded-xl border border-border bg-white p-5 shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-navy-300">
                Pre-join
              </p>

              <h2 className="mt-2 text-xl font-black text-navy-900 sm:text-2xl">
                Choose how to enter
              </h2>

              <div className="mt-6 grid gap-3">
                <button
                  onClick={startAsHost}
                  className="telefya-interactive telefya-lift telefya-press telefya-focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-telefya-blue px-5 text-sm font-black text-white shadow-soft hover:bg-telefya-violet"
                >
                  <Radio size={17} />
                  Start meeting as host
                </button>

                <button
                  onClick={joinAsParticipant}
                  className="telefya-interactive telefya-press telefya-focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-black text-navy-800 hover:border-telefya-blue hover:text-telefya-blue"
                >
                  <Video size={17} />
                  Join as participant
                </button>

                <button
                  onClick={copyRoomLink}
                  className="telefya-interactive telefya-press telefya-focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-navy-50 px-5 text-sm font-black text-navy-700 hover:border-telefya-green hover:text-telefya-green"
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
        "grid overflow-hidden telefya-mesh-bg",
      ].join(" ")}
    >
      <RoomStyles />

      <section className="relative flex min-h-0 flex-col overflow-hidden telefya-mesh-bg">
        <header className="flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent px-3 sm:h-[68px] sm:gap-4 sm:px-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Image
              src="/images/telefya-logo.png"
              alt="Telefya"
              width={142}
              height={43}
              priority
              className="h-7 w-auto shrink-0 sm:h-9"
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

          <div className="flex items-center gap-1.5 sm:gap-2">
            <TopPill
              icon={room.connected ? ShieldCheck : Loader2}
              label={room.connected ? "Secure" : "Connecting"}
              spin={!room.connected}
              pulse={room.connected}
            />

            <IconPill icon={Users} label={`${participantCount} people`} />

            <span className="hidden sm:inline-flex">
              <IconPill icon={RefreshCw} label="Sync" />
            </span>

            <span className="hidden sm:inline-flex">
              <IconPill icon={Globe2} label="Workspace" />
            </span>

            {raisedHandCount > 0 ? (
              <span className="telefya-pop-in">
                <IconPill
                  icon={Hand}
                  label={`${raisedHandCount} raised`}
                  tone="amber"
                />
              </span>
            ) : null}

            {room.recording ? (
              <span className="telefya-pop-in inline-flex h-8 items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 text-[11px] font-black text-red-100 ring-1 ring-red-400/25 sm:h-9 sm:gap-2 sm:px-3 sm:text-xs">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                <span className="hidden sm:inline">REC </span>
                {recordingElapsed}
              </span>
            ) : null}
          </div>
        </header>

        {room.error || room.recordingError || billingNotice ? (
          <div className="mx-3 mt-3 grid gap-2 sm:mx-4">
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
            "grid min-h-0 flex-1 gap-2 p-1.5 pb-32 sm:gap-3 sm:p-2 xl:pb-2",
            chatOpen ? "xl:grid-cols-[minmax(0,1fr)_320px]" : "xl:grid-cols-1",
          ].join(" ")}
        >
          <div className="relative flex min-h-0 flex-col gap-2 sm:gap-3">
            <div className="telefya-stage-bg relative min-h-[340px] flex-1 overflow-hidden rounded-2xl ring-1 ring-white/10 sm:min-h-[440px]">
              {primaryTile ? (
                <StageTileView
                  tile={primaryTile}
                  recording={room.recording}
                  large
                />
              ) : (
                <div className="grid h-full place-items-center text-white">
                  <div className="flex items-center gap-3 text-sm font-black">
                    <Loader2
                      className="animate-spin text-telefya-blue"
                      size={20}
                    />
                    Preparing camera...
                  </div>
                </div>
              )}

              {railTiles.length ? (
                <div className="pointer-events-none absolute right-3 top-3 z-30 hidden max-h-[70%] flex-col gap-2 overflow-y-auto xl:flex">
                  {railTiles.map((tile, index) => (
                    <div
                      key={tile.id}
                      className={`telefya-in-right telefya-stagger-${Math.min(index + 1, 8)} pointer-events-auto h-24 w-40 shrink-0 overflow-hidden rounded-xl shadow-2xl`}
                    >
                      <PipTile tile={tile} />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {railTiles.length ? (
              <div className="telefya-rail flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 xl:hidden">
                {railTiles.map((tile, index) => (
                  <div
                    key={tile.id}
                    className={`telefya-in-fade-up telefya-stagger-${Math.min(index + 1, 8)} h-[86px] w-[132px] shrink-0 snap-start overflow-hidden rounded-xl sm:h-[96px] sm:w-[152px]`}
                  >
                    <PipTile tile={tile} />
                  </div>
                ))}
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

        <div className="absolute inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-3 sm:bottom-6 sm:px-4">
          <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 shadow-2xl backdrop-blur-2xl xl:flex">
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
                <div className="telefya-in-scale absolute bottom-[76px] left-1/2 w-[260px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-white p-2 text-navy-900 shadow-enterprise">
                  <p className="px-2 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-navy-400">
                    Participants ({participantCount})
                  </p>

                  <div className="mt-1 grid max-h-64 gap-1 overflow-y-auto">
                    {allParticipantTiles.map((tile) => (
                      <ParticipantRow key={tile.id} tile={tile} />
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
                <div className="telefya-in-scale absolute bottom-[76px] left-1/2 max-h-[75vh] w-[340px] -translate-x-1/2 overflow-y-auto rounded-2xl border border-white/10 bg-white p-2 text-navy-900 shadow-enterprise">
                  <BackgroundPicker
                    room={room}
                    backgroundsSupported={backgroundsSupported}
                    pendingBackgroundId={pendingBackgroundId}
                    options={allBackgroundOptions}
                    selectedId={selectedBackgroundId}
                    onChoose={chooseBackground}
                    onAddCustom={addCustomBackground}
                    onRemoveCustom={removeCustomBackground}
                  />

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

          <div className="flex w-full max-w-[340px] items-center justify-between gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-2 shadow-2xl backdrop-blur-2xl xl:hidden">
            <DockButton
              size="md"
              active={!room.micOn}
              danger={!room.micOn}
              icon={room.micOn ? Mic : MicOff}
              label={room.micOn ? "Mute" : "Unmute"}
              onClick={room.toggleMic}
            />

            <DockButton
              size="md"
              active={!room.cameraOn}
              danger={!room.cameraOn}
              icon={room.cameraOn ? Video : VideoOff}
              label={room.cameraOn ? "Stop video" : "Start video"}
              onClick={room.toggleCamera}
            />

            <div className="relative">
              <DockButton
                size="md"
                active={chatOpen}
                icon={MessageSquare}
                label="Chat"
                onClick={() => setChatOpen((value) => !value)}
              />

              {unreadCount > 0 && !chatOpen ? (
                <span className="telefya-pop-in pointer-events-none absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[9px] font-black text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </div>

            <DockButton
              size="md"
              active={moreOpen}
              icon={MoreHorizontal}
              label="More"
              onClick={() => setMoreOpen((value) => !value)}
            />

            <DockButton
              size="md"
              danger
              icon={PhoneOff}
              label="Leave"
              onClick={leaveRoom}
            />
          </div>
        </div>

        <MobileSheet
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          title="More options"
        >
          <BackgroundPicker
            room={room}
            backgroundsSupported={backgroundsSupported}
            pendingBackgroundId={pendingBackgroundId}
            options={allBackgroundOptions}
            selectedId={selectedBackgroundId}
            onChoose={chooseBackground}
            onAddCustom={addCustomBackground}
            onRemoveCustom={removeCustomBackground}
          />

          <MenuAction
            active={room.screenOn}
            icon={room.screenOn ? ScreenShareOff : MonitorUp}
            label={room.screenOn ? "Stop sharing" : "Share screen"}
            caption="Share your screen with everyone"
            onClick={() => {
              setMoreOpen(false);
              room.toggleScreenShare();
            }}
          />

          <MenuAction
            icon={Users}
            label={`Participants (${participantCount})`}
            caption="See who is in the meeting"
            onClick={() => {
              setMoreOpen(false);
              setParticipantsOpen(true);
            }}
          />

          {isHost ? (
            <MenuAction
              disabled={recordingAction || (!room.recording && !recordingReady)}
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
            active={copied}
            icon={copied ? CheckCircle2 : Copy}
            label={copied ? "Invite copied" : "Copy invite"}
            caption="Share this room link"
            onClick={() => {
              setMoreOpen(false);
              copyRoomLink();
            }}
          />
        </MobileSheet>

        <MobileSheet
          open={participantsOpen}
          onClose={() => setParticipantsOpen(false)}
          title={`Participants (${participantCount})`}
        >
          <div className="grid gap-1">
            {allParticipantTiles.map((tile) => (
              <ParticipantRow key={tile.id} tile={tile} />
            ))}
          </div>
        </MobileSheet>

        <MobileChatSheet
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          messages={room.messages as ChatMessage[]}
          onSend={room.sendMessage}
        />

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
    <aside className="telefya-in-right hidden min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1734] text-white shadow-2xl xl:flex xl:flex-col">
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-5">
        <h2 className="text-2xl font-black">Chat</h2>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onClose}
            className="telefya-interactive telefya-press grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            title="Collapse chat"
          >
            <ChevronsRight size={16} />
          </button>

          <button
            onClick={onClose}
            className="telefya-interactive telefya-press grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
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
                className="telefya-in-fade-up grid gap-1.5"
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
        <div className="telefya-interactive flex h-12 items-center gap-2 rounded-xl bg-white/8 px-3 focus-within:bg-white/10">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message..."
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/35"
          />

          <button
            type="submit"
            className="telefya-interactive telefya-press grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-telefya-blue text-white hover:bg-telefya-violet"
            title="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </aside>
  );
}

function MobileSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="xl:hidden">
      <div
        onClick={onClose}
        aria-hidden="true"
        className={[
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <div
        className={[
          "fixed inset-x-0 bottom-0 z-50 max-h-[80vh] rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-navy-200" />

        <div className="flex items-center justify-between px-5 pb-3 pt-3">
          <h2 className="text-base font-black text-navy-900">{title}</h2>

          <button
            onClick={onClose}
            aria-label="Close"
            className="telefya-interactive telefya-press grid h-8 w-8 place-items-center rounded-lg bg-navy-50 text-navy-500"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[calc(80vh-64px)] overflow-y-auto px-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}

function MobileChatSheet({
  open,
  onClose,
  messages,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSend: (message: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, open]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const clean = draft.trim();
    if (!clean) return;

    onSend(clean);
    setDraft("");
  }

  return (
    <div className="xl:hidden">
      <div
        onClick={onClose}
        aria-hidden="true"
        className={[
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <div
        className={[
          "fixed inset-x-0 bottom-0 z-50 flex h-[85vh] flex-col rounded-t-3xl bg-[#0c1734] text-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-white/20" />

        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-3">
          <h2 className="text-lg font-black">Chat</h2>

          <button
            onClick={onClose}
            aria-label="Close chat"
            className="telefya-interactive telefya-press grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white/70"
          >
            <X size={16} />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-2"
        >
          {messages.length === 0 ? (
            <p className="text-sm font-bold leading-6 text-white/45">
              Meeting messages appear here.
            </p>
          ) : (
            <div className="grid gap-4 pb-2">
              {messages.map((message, index) => (
                <div
                  key={
                    message.messageId || `${message.socketId || "msg"}-${index}`
                  }
                  className="telefya-in-fade-up grid gap-1.5"
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

        <form
          onSubmit={submit}
          className="shrink-0 border-t border-white/10 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        >
          <div className="telefya-interactive flex h-12 items-center gap-2 rounded-xl bg-white/8 px-3 focus-within:bg-white/10">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message..."
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/35"
            />

            <button
              type="submit"
              className="telefya-interactive telefya-press grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-telefya-blue text-white hover:bg-telefya-violet"
              title="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BackgroundPicker({
  room,
  backgroundsSupported,
  pendingBackgroundId,
  options,
  selectedId,
  onChoose,
  onAddCustom,
  onRemoveCustom,
}: {
  room: ReturnType<typeof useMediasoupRoom>;
  backgroundsSupported: boolean;
  pendingBackgroundId: string | null;
  options: {
    id: string;
    label: string;
    value: VirtualBackground;
    removable?: boolean;
  }[];
  selectedId: string;
  onChoose: (background: VirtualBackground, id: string) => void;
  onAddCustom: () => void;
  onRemoveCustom: (id: string) => void;
}) {
  const busy = Boolean(pendingBackgroundId);
  const disabled = !backgroundsSupported || busy;

  return (
    <div className="mb-2 rounded-xl border border-navy-100 bg-navy-50 p-2">
      <div className="mb-1.5 flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-2">
          <Palette size={15} className="text-telefya-blue" />
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-navy-400">
            Background
          </span>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={onAddCustom}
          title="Add a custom background image"
          className="telefya-interactive telefya-press inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-telefya-blue ring-1 ring-blue-100 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      <div className="grid max-h-64 grid-cols-3 gap-1.5 overflow-y-auto pr-0.5">
        {options.map((option) => {
          const selected = selectedId === option.id;
          const isPending = pendingBackgroundId === option.id;
          const isImage = option.value.type === "image";

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onChoose(option.value, option.id)}
              title={option.label}
              className={[
                "telefya-interactive telefya-press group relative aspect-square overflow-hidden rounded-lg text-left",
                selected
                  ? "ring-2 ring-telefya-blue ring-offset-1"
                  : "ring-1 ring-navy-100 hover:ring-telefya-blue/50",
                disabled ? "cursor-wait opacity-60" : "",
              ].join(" ")}
            >
              {option.value.type === "none" ? (
                <div className="grid h-full w-full place-items-center bg-white">
                  <Ban size={18} className="text-navy-300" />
                </div>
              ) : option.value.type === "blur" ? (
                <div className="relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br from-blue-200 via-violet-200 to-blue-100">
                  <div
                    className={[
                      "absolute inset-0",
                      option.value.intensity === "light"
                        ? "backdrop-blur-[2px]"
                        : option.value.intensity === "strong"
                          ? "backdrop-blur-md"
                          : "backdrop-blur-sm",
                    ].join(" ")}
                  />
                  <Sparkles size={16} className="relative text-white drop-shadow" />
                </div>
              ) : isImage ? (

                <img
                  src={option.value.url}
                  alt={option.label}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}

              {selected ? (
                <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-telefya-blue text-white shadow">
                  <CheckCircle2 size={11} />
                </span>
              ) : null}

              {isPending ? (
                <span className="absolute inset-0 grid place-items-center bg-black/40">
                  <Loader2 size={16} className="animate-spin text-white" />
                </span>
              ) : null}

              {option.removable ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveCustom(option.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.stopPropagation();
                    onRemoveCustom(option.id);
                  }}
                  title="Remove"
                  className="telefya-interactive absolute left-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-black/55 text-white opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={10} />
                </span>
              ) : null}

              <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1 text-[9px] font-black text-white">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {!backgroundsSupported ? (
        <p className="mt-1.5 px-1 text-[10px] font-bold text-navy-400">
          Not supported on this browser or device.
        </p>
      ) : room.backgroundStatus === "loading" ? (
        <p className="mt-1.5 px-1 text-[10px] font-bold text-navy-400">
          Loading background model...
        </p>
      ) : room.backgroundStatus === "error" && room.backgroundError ? (
        <p className="mt-1.5 px-1 text-[10px] font-bold text-red-500">
          {room.backgroundError}
        </p>
      ) : null}
    </div>
  );
}

function ParticipantRow({ tile }: { tile: StageTile }) {
  return (
    <div className="telefya-interactive flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-navy-50">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy-50 text-xs font-black text-navy-700">
        {getInitials(tile.name)}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-navy-800">
        {tile.name}
      </span>
      {tile.micOn === false ? (
        <MicOff size={14} className="shrink-0 text-navy-300" />
      ) : (
        <Mic size={14} className="shrink-0 text-emerald-500" />
      )}
    </div>
  );
}

function StageTileView({
  tile,
  large,
  recording,
}: {
  tile: StageTile;
  large?: boolean;
  recording?: boolean;
}) {
  const showVideo = Boolean(tile.stream && tile.cameraOn !== false);

  return (
    <div className="telefya-in-scale group relative h-full w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/5">
      {recording ? (
        <div className="absolute left-3 top-3 z-20 inline-flex items-center gap-2 rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-black text-white shadow-soft ring-1 ring-white/20">
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
          large={large}
        />
      ) : (
        <AvatarTile tile={tile} compact={!large} />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />

      {large ? (
        <div className="absolute bottom-2.5 left-2.5 z-20 flex max-w-[calc(100%-20px)] items-center gap-1.5 overflow-hidden rounded-full bg-black/55 py-1.5 pl-2.5 pr-3 text-sm font-black text-white ring-1 ring-white/10 backdrop-blur-md">
          {tile.micOn === false ? (
            <MicOff size={14} className="shrink-0 text-red-300" />
          ) : (
            <Mic size={14} className="shrink-0 text-emerald-300" />
          )}
          <span className="min-w-0 truncate">{tile.name}</span>
        </div>
      ) : (
        <div
          className={[
            "absolute bottom-1.5 left-1.5 z-20 grid h-5 w-5 place-items-center rounded-full backdrop-blur-md",
            tile.micOn === false ? "bg-red-500/70" : "bg-black/45",
          ].join(" ")}
          title={tile.name}
        >
          {tile.micOn === false ? (
            <MicOff size={11} className="text-white" />
          ) : (
            <Mic size={11} className="text-emerald-300" />
          )}
        </div>
      )}

      {tile.cameraOn === false ? (
        <div className="absolute right-2.5 top-2.5 z-20 rounded-full bg-black/55 p-1.5 text-white/80 ring-1 ring-white/10 backdrop-blur-md">
          <VideoOff size={13} />
        </div>
      ) : null}
    </div>
  );
}

function PipTile({ tile }: { tile: StageTile }) {
  const showVideo = Boolean(tile.stream && tile.cameraOn !== false);
  const label = tile.isSelf ? "You" : tile.name.split(" ")[0] || tile.name;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/15">
      {showVideo ? (
        <LiveVideoTile
          stream={tile.stream as MediaStream}
          name={label}
          muted={tile.muted}
          cameraOn={tile.cameraOn}
          micOn={tile.micOn}
          isScreen={tile.isScreen}
          compact
          hideOverlay
        />
      ) : (
        <AvatarTile tile={{ ...tile, name: label }} compact />
      )}

      <span className="pointer-events-none absolute bottom-1.5 left-1.5 z-20 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-black text-white ring-1 ring-white/10 backdrop-blur-md">
        {label}
      </span>
    </div>
  );
}

function AvatarTile({ tile, compact }: { tile: StageTile; compact?: boolean }) {
  return (
    <div className="telefya-stage-bg grid h-full min-h-[140px] place-items-center text-white sm:min-h-[180px]">
      <div className="grid place-items-center text-center">
        <div
          className={[
            "telefya-gradient grid place-items-center rounded-full font-black text-white shadow-2xl",
            compact
              ? "h-14 w-14 text-lg sm:h-16 sm:w-16 sm:text-xl"
              : "h-20 w-20 text-3xl sm:h-28 sm:w-28 sm:text-4xl",
          ].join(" ")}
        >
          {getInitials(tile.name)}
        </div>
        {!compact ? (
          <>
            <p className="mt-3 max-w-[220px] truncate text-base font-black text-white sm:mt-4 sm:text-xl">
              {tile.name}
            </p>
            <p className="mt-1 text-[11px] font-bold text-white/45 sm:text-xs">
              Camera off
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

function TopPill({
  icon: Icon,
  label,
  spin,
  pulse,
}: {
  icon: LucideIcon;
  label: string;
  spin?: boolean;
  pulse?: boolean;
}) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 text-[11px] font-black text-emerald-100 ring-1 ring-emerald-400/20 sm:h-9 sm:gap-2 sm:px-3 sm:text-xs">
      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
        <Icon
          size={14}
          className={[spin ? "animate-spin" : "", pulse ? "telefya-pulse-dot" : ""].join(" ")}
        />
      </span>
      <span className="hidden sm:inline">{label}</span>
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
        "grid h-8 w-8 place-items-center rounded-full ring-1 sm:h-9 sm:w-9",
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
        "telefya-toast-in absolute left-3 right-3 top-[72px] z-40 flex items-start gap-3 rounded-lg border border-white/10 bg-[#0c1734]/95 px-4 py-3 text-xs font-semibold shadow-lg backdrop-blur-xl sm:left-auto sm:right-5 sm:top-[84px] sm:max-w-xs",
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
        "telefya-in-fade-up flex items-start justify-between gap-4 rounded-xl px-4 py-3 text-sm font-bold",
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
              className="telefya-interactive telefya-press mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-white px-4 text-xs font-black text-navy-900 hover:bg-blue-50 hover:text-telefya-blue"
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
        className="telefya-interactive telefya-press grid h-8 w-8 shrink-0 place-items-center rounded-lg text-current opacity-70 hover:bg-white/10 hover:opacity-100"
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
        "telefya-in-fade-up flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-bold",
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
  size = "lg",
}: {
  active?: boolean;
  danger?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  size?: "md" | "lg";
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={[
        "telefya-interactive telefya-focus-ring grid shrink-0 place-items-center rounded-full active:scale-90",
        size === "lg" ? "h-14 w-14" : "h-12 w-12",
        danger
          ? "bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600"
          : active
            ? "bg-telefya-blue text-white shadow-lg shadow-telefya-blue/30 ring-2 ring-telefya-blue/30"
            : "bg-white/8 text-white/85 ring-1 ring-white/10 backdrop-blur-md hover:bg-white/15 hover:text-white",
      ].join(" ")}
    >
      <Icon size={size === "lg" ? 20 : 18} />
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
        "telefya-interactive flex w-full items-center gap-3 rounded-xl p-3 text-left active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100",
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