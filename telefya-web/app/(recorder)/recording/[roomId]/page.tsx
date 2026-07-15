"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMediasoupRoom } from "@/hooks/use-mediasoup-room";

declare global {
  interface Window {
    telefyaRecorderReady?: boolean;
    telefyaRecorderUploaded?: boolean;
    telefyaStartRecording?: () => Promise<void>;
    telefyaStopRecording?: () => Promise<void>;
  }
}

type RecorderStream = {
  id: string;
  kind: "audio" | "video";
  stream: MediaStream;
  userId?: string;
  userName?: string;
  isScreen?: boolean;
  micOn?: boolean;
  cameraOn?: boolean;
};

type VideoEntry = {
  id: string;
  userId?: string;
  name: string;
  isScreen?: boolean;
  micOn?: boolean;
  cameraOn?: boolean;
  video?: HTMLVideoElement;
};

type ParticipantMeta = {
  userId?: string;
  id?: string;
  userName?: string;
  name?: string;
  micOn?: boolean;
  cameraOn?: boolean;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
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
  if (Array.isArray(value)) return value as ParticipantMeta[];
  if (typeof value === "object") {
    return Object.values(value as Record<string, ParticipantMeta>);
  }
  return [];
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const sourceWidth = video.videoWidth || 16;
  const sourceHeight = video.videoHeight || 9;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }

  ctx.drawImage(video, sx, sy, sw, sh, x, y, width, height);
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: VideoEntry,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.save();

  roundRect(ctx, x, y, width, height, 8);
  ctx.clip();

  ctx.fillStyle = "#050914";
  ctx.fillRect(x, y, width, height);

  const canDrawVideo =
    tile.video && tile.video.readyState >= 2 && tile.cameraOn !== false;

  if (canDrawVideo && tile.video) {
    drawCover(ctx, tile.video, x, y, width, height);
  } else {
    ctx.fillStyle = "#071832";
    ctx.fillRect(x, y, width, height);

    const avatarSize = Math.min(width, height) * 0.22;
    const cx = x + width / 2;
    const cy = y + height / 2 - 18;

    const gradient = ctx.createLinearGradient(
      cx - avatarSize,
      cy - avatarSize,
      cx + avatarSize,
      cy + avatarSize,
    );
    gradient.addColorStop(0, "#0f6bff");
    gradient.addColorStop(0.55, "#6426ff");
    gradient.addColorStop(1, "#10d98f");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, avatarSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${Math.max(22, avatarSize * 0.72)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(getInitials(tile.name), cx, cy);

    ctx.font = "800 20px Arial";
    ctx.fillText(tile.name, cx, cy + avatarSize + 34);

    ctx.font = "700 13px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.48)";
    ctx.fillText("Camera off", cx, cy + avatarSize + 58);

    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  const labelWidth = Math.min(width - 24, 250);
  ctx.fillStyle = "rgba(3,10,31,0.72)";
  roundRect(ctx, x + 12, y + height - 48, labelWidth, 34, 10);
  ctx.fill();

  ctx.fillStyle = tile.micOn === false ? "#fecaca" : "#bbf7d0";
  ctx.beginPath();
  ctx.arc(x + 29, y + height - 31, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 15px Arial";
  ctx.fillText(tile.name, x + 42, y + height - 26);

  if (tile.cameraOn === false) {
    ctx.fillStyle = "rgba(3,10,31,0.72)";
    roundRect(ctx, x + width - 90, y + 14, 76, 30, 999);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 11px Arial";
    ctx.fillText("VIDEO OFF", x + width - 78, y + 34);
  }

  ctx.restore();
}

function drawTopBar(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  participantCount: number,
) {
  ctx.fillStyle = "#07122d";
  ctx.fillRect(0, 0, 1280, 68);

  if (logo) {
    ctx.drawImage(logo, 24, 17, 142, 43);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 24px Arial";
    ctx.fillText("Telefya", 30, 43);
  }

  ctx.fillStyle = "rgba(16,217,143,0.14)";
  roundRect(ctx, 842, 18, 100, 32, 999);
  ctx.fill();
  ctx.fillStyle = "#bbf7d0";
  ctx.font = "800 13px Arial";
  ctx.fillText("Secure", 878, 39);
  ctx.beginPath();
  ctx.arc(862, 33, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, 954, 18, 120, 32, 999);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.font = "800 13px Arial";
  ctx.fillText(`${participantCount} people`, 980, 39);

  ctx.fillStyle = "rgba(239,68,68,0.16)";
  roundRect(ctx, 1100, 18, 92, 32, 999);
  ctx.fill();
  ctx.fillStyle = "#fecaca";
  ctx.font = "800 13px Arial";
  ctx.fillText("REC", 1138, 39);
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(1120, 33, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawChatPanel(ctx: CanvasRenderingContext2D, messages: any[]) {
  const x = 946;
  const y = 78;
  const width = 324;
  const height = 540;

  ctx.fillStyle = "#0c1734";
  roundRect(ctx, x, y, width, height, 16);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 22px Arial";
  ctx.fillText("Chat", x + 24, y + 42);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(x + 20, y + 60, width - 40, 1);

  const recent = messages.slice(-5);
  let cursorY = y + 98;

  if (!recent.length) {
    ctx.fillStyle = "rgba(255,255,255,0.46)";
    ctx.font = "700 14px Arial";
    ctx.fillText("Meeting messages appear here.", x + 24, cursorY);
    return;
  }

  for (const message of recent) {
    const name = message.userName || "Participant";
    const text = message.message || "";

    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "800 14px Arial";
    ctx.fillText(name, x + 24, cursorY);

    ctx.fillStyle = "rgba(255,255,255,0.10)";
    roundRect(ctx, x + 24, cursorY + 10, width - 56, 54, 10);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.76)";
    ctx.font = "700 14px Arial";
    ctx.fillText(text.slice(0, 34), x + 40, cursorY + 42);

    cursorY += 86;
  }
}

function drawDock(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#08142f";
  ctx.fillRect(0, 628, 1280, 92);

  const items = [
    ["Chat", 446],
    ["Mic", 524],
    ["Video", 602],
    ["Share", 680],
    ["People", 758],
    ["More", 836],
  ];

  for (const [label, x] of items) {
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    roundRect(ctx, Number(x), 646, 58, 54, 14);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "800 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(label), Number(x) + 29, 678);
    ctx.textAlign = "start";
  }

  ctx.fillStyle = "#ef4444";
  roundRect(ctx, 914, 646, 66, 54, 14);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 13px Arial";
  ctx.fillText("Leave", 929, 678);
}

function drawWaitingSlate(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
) {
  ctx.fillStyle = "#050b1f";
  ctx.fillRect(0, 0, 1280, 720);

  ctx.fillStyle = "#07122d";
  ctx.fillRect(0, 0, 1280, 68);

  if (logo) {
    ctx.drawImage(logo, 24, 17, 142, 43);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 24px Arial";
    ctx.fillText("Telefya", 30, 43);
  }

  ctx.fillStyle = "#050914";
  roundRect(ctx, 10, 78, 920, 540, 12);
  ctx.fill();

  ctx.fillStyle = "#0c1734";
  roundRect(ctx, 946, 78, 324, 540, 16);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 22px Arial";
  ctx.fillText("Chat", 970, 120);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(966, 138, 284, 1);

  ctx.fillStyle = "#08142f";
  ctx.fillRect(0, 628, 1280, 92);
}

export default function RecorderPage() {
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();

  const roomId = decodeURIComponent(params.roomId);
  const recordingId = searchParams.get("recordingId") || "";
  const secret = searchParams.get("secret") || "";

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const logoRef = useRef<HTMLImageElement | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(
    null,
  );
  const audioSourcesRef = useRef<Map<string, MediaStreamAudioSourceNode>>(
    new Map(),
  );
  const silentOscillatorRef = useRef<OscillatorNode | null>(null);

  const room = useMediasoupRoom({
    enabled: Boolean(roomId && recordingId && secret),
    roomId,
    userId: `recorder-${recordingId}`,
    userName: "Telefya Recorder",
    isHost: false,
    recordingMode: true,
    recorderSecret: secret,
  });

  const videoStreams = useMemo(
    () =>
      room.remoteStreams.filter(
        (stream) => stream.kind === "video",
      ) as RecorderStream[],
    [room.remoteStreams],
  );

  const audioStreams = useMemo(
    () =>
      room.remoteStreams.filter(
        (stream) => stream.kind === "audio",
      ) as RecorderStream[],
    [room.remoteStreams],
  );

  const participants = normalizeParticipants((room as any).participants);

  const syncAudioSources = useCallback((streams: RecorderStream[]) => {
    const audioContext = audioContextRef.current;
    const destination = audioDestinationRef.current;

    if (!audioContext || !destination) return;

    for (const item of streams) {
      if (audioSourcesRef.current.has(item.id)) continue;

      const hasLiveAudio = item.stream.getAudioTracks().some((track) => {
        return track.readyState === "live";
      });

      if (!hasLiveAudio) continue;

      const source = audioContext.createMediaStreamSource(item.stream);
      source.connect(destination);
      audioSourcesRef.current.set(item.id, source);
    }

    for (const [id, source] of audioSourcesRef.current) {
      const stillExists = streams.some((stream) => stream.id === id);

      if (!stillExists) {
        source.disconnect();
        audioSourcesRef.current.delete(id);
      }
    }
  }, []);

  useEffect(() => {
    const image = new Image();
    image.src = "/images/telefya-logo.png";
    image.onload = () => {
      logoRef.current = image;
    };
  }, []);

  useEffect(() => {
    syncAudioSources(audioStreams);
  }, [audioStreams, syncAudioSources]);

  useEffect(() => {
    for (const stream of videoStreams) {
      if (videosRef.current.has(stream.id)) continue;

      const video = document.createElement("video");
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream.stream;
      video.play().catch(() => undefined);

      videosRef.current.set(stream.id, video);
    }

    for (const [id, video] of videosRef.current) {
      if (!videoStreams.some((stream) => stream.id === id)) {
        video.pause();
        video.srcObject = null;
        videosRef.current.delete(id);
      }
    }
  }, [videoStreams]);

  useEffect(() => {
    let animation = 0;

    function draw() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      if (!canvas || !ctx) {
        animation = requestAnimationFrame(draw);
        return;
      }

      ctx.fillStyle = "#060b1f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const participantById = new Map<string, ParticipantMeta>();

      for (const participant of participants) {
        const id = participant.userId || participant.id;
        if (id) participantById.set(String(id), participant);
      }

      const videoEntries: VideoEntry[] = videoStreams.map((stream) => {
        const participant = stream.userId
          ? participantById.get(String(stream.userId))
          : undefined;

        return {
          id: stream.id,
          userId: stream.userId,
          name:
            stream.userName ||
            participant?.userName ||
            participant?.name ||
            "Participant",
          isScreen: stream.isScreen,
          micOn:
            typeof participant?.micOn === "boolean"
              ? participant.micOn
              : audioStreams.some((audio) => audio.userId === stream.userId),
          cameraOn:
            typeof participant?.cameraOn === "boolean"
              ? participant.cameraOn
              : true,
          video: videosRef.current.get(stream.id),
        };
      });

      const knownAudioOnly: VideoEntry[] = audioStreams
        .filter((audio) => {
          return !videoEntries.some((video) => video.userId === audio.userId);
        })
        .map((audio): VideoEntry => {
          const participant = audio.userId
            ? participantById.get(String(audio.userId))
            : undefined;

          return {
            id: audio.id,
            userId: audio.userId,
            name:
              audio.userName ||
              participant?.userName ||
              participant?.name ||
              "Participant",
            micOn:
              typeof participant?.micOn === "boolean"
                ? participant.micOn
                : true,
            cameraOn: false,
            video: undefined,
          };
        });

      const entries = [...videoEntries, ...knownAudioOnly];
      const readyEntries = entries.filter((entry) => {
        return !entry.video || entry.video.readyState >= 2;
      });

      if (!readyEntries.length) {
        drawWaitingSlate(ctx, logoRef.current);
        animation = requestAnimationFrame(draw);
        return;
      }

      drawTopBar(ctx, logoRef.current, Math.max(1, readyEntries.length));

      const screen = readyEntries.find((entry) => entry.isScreen);
      const people = readyEntries.filter((entry) => entry.id !== screen?.id);
      const stageX = 10;
      const stageY = 78;
      const stageW = 920;
      const stageH = 540;

      if (screen) {
        drawTile(ctx, screen, stageX, stageY, 690, stageH);

        people.slice(0, 4).forEach((person, index) => {
          drawTile(ctx, person, stageX + 704, stageY + index * 134, 216, 126);
        });
      } else {
        const count = Math.max(people.length, 1);
        const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3;
        const rows = Math.ceil(count / cols);
        const gap = 6;
        const tileW = (stageW - gap * (cols - 1)) / cols;
        const tileH = (stageH - gap * (rows - 1)) / rows;

        people.slice(0, 9).forEach((person, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = stageX + col * (tileW + gap);
          const y = stageY + row * (tileH + gap);

          drawTile(ctx, person, x, y, tileW, tileH);
        });
      }

      drawChatPanel(ctx, room.messages || []);
      drawDock(ctx);

      animation = requestAnimationFrame(draw);
    }

    draw();

    return () => cancelAnimationFrame(animation);
  }, [videoStreams, audioStreams, participants, room.messages]);

  useEffect(() => {
    window.telefyaRecorderReady =
      Boolean(canvasRef.current) &&
      Boolean(roomId) &&
      Boolean(recordingId) &&
      Boolean(secret) &&
      typeof window.telefyaStartRecording === "function";

    return () => {
      window.telefyaRecorderReady = false;
    };
  }, [roomId, recordingId, secret, room.connected, room.remoteStreams.length]);

  useEffect(() => {
    window.telefyaStartRecording = async () => {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Recorder canvas is not ready.");

      chunksRef.current = [];
      window.telefyaRecorderUploaded = false;

      const canvasStream = canvas.captureStream(30);

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      const audioContext = new AudioContextClass();
      await audioContext.resume();

      const destination = audioContext.createMediaStreamDestination();

      audioContextRef.current = audioContext;
      audioDestinationRef.current = destination;

      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;

      const silentOscillator = audioContext.createOscillator();
      silentOscillator.connect(silentGain);
      silentGain.connect(destination);
      silentOscillator.start();

      silentOscillatorRef.current = silentOscillator;

      syncAudioSources(audioStreams);

      const mixedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);

      const mimeType = MediaRecorder.isTypeSupported(
        "video/webm;codecs=vp8,opus",
      )
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const recorder = new MediaRecorder(mixedStream, {
        mimeType,
        videoBitsPerSecond: 4_500_000,
        audioBitsPerSecond: 128_000,
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start(1000);
      recorderRef.current = recorder;

      console.log("Telefya recorder started");
    };

    window.telefyaStopRecording = async () => {
      const recorder = recorderRef.current;

      if (!recorder) {
        window.telefyaRecorderUploaded = true;
        return;
      }

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      const blob = new Blob(chunksRef.current, {
        type: "video/webm",
      });

      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        "http://localhost:5000";

      const response = await fetch(
        `${backendUrl}/api/v2/recording-bot/upload/${encodeURIComponent(
          recordingId,
        )}?secret=${encodeURIComponent(secret)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "video/webm",
          },
          body: blob,
        },
      );

      if (!response.ok) {
        throw new Error("Unable to upload finalized recording.");
      }

      for (const source of audioSourcesRef.current.values()) {
        source.disconnect();
      }

      audioSourcesRef.current.clear();

      try {
        silentOscillatorRef.current?.stop();
      } catch {}

      silentOscillatorRef.current = null;

      audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
      audioDestinationRef.current = null;
      recorderRef.current = null;
      chunksRef.current = [];

      window.telefyaRecorderUploaded = true;
      console.log("Telefya recorder uploaded");
    };

    return () => {
      delete window.telefyaStartRecording;
      delete window.telefyaStopRecording;
    };
  }, [audioStreams, recordingId, secret, syncAudioSources]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#050b1f]">
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="h-screen w-screen object-contain"
      />
    </main>
  );
}
