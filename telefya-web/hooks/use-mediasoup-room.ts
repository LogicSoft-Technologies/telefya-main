"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";
import type {
  AppData,
  DtlsParameters,
  Producer,
  RtpCapabilities,
  RtpParameters,
  Transport,
  TransportOptions,
} from "mediasoup-client/types";
import { closeMeetingSocket, getMeetingSocket } from "@/lib/realtime/socket";

type RemoteStream = {
  id: string;
  producerId: string;
  userId?: string;
  userName?: string;
  isScreen?: boolean;
  kind: "audio" | "video";
  stream: MediaStream;
  micOn?: boolean;
  cameraOn?: boolean;
};

type ProducerMeta = {
  producerId: string;
  kind: "audio" | "video";
  userId?: string;
  userName?: string;
  isScreen?: boolean;
  appData?: Record<string, unknown>;
};

type ChatMessage = {
  roomId: string;
  message: string;
  time: string;
  userName: string;
  socketId: string;
  messageId: string;
};

type ParticipantState = {
  userId: string;
  userName: string;
  micOn: boolean;
  cameraOn: boolean;
  isHost?: boolean;
};

type JoinResponse = {
  success?: boolean;
  rtpCapabilities?: RtpCapabilities;
  isHost?: boolean;
  existingProducers?: ProducerMeta[];
  participants?: ParticipantState[] | Record<string, ParticipantState>;
  billing?: BillingPolicy | null;
  error?: string;
  message?: string;
  code?: string;
  status?: number;
};

type ConsumedPayload = {
  consumer: {
    id: string;
    kind: "audio" | "video";
    rtpParameters: RtpParameters;
    userId?: string;
    userName?: string;
    isScreen?: boolean;
    appData?: Record<string, unknown>;
  };
  producerId: string;
  appData?: Record<string, unknown>;
};

type BillingPolicy = {
  roomId?: string;
  hostUserId?: string;
  hostUserName?: string;
  plan_code?: string;
  plan_name?: string;
  status?: string;
  startedAt?: string;
  limits?: {
    max_meeting_minutes?: number;
    max_participants?: number;
    monthly_recording_minutes?: number;
    storage_gb?: number;
    recording_enabled?: boolean;
    analytics_enabled?: boolean;
    priority_support?: boolean;
  };
};

type BillingNotice = {
  type: "warning" | "error" | "ended";
  title: string;
  message: string;
  code?: string;
  action?: string;
  billing?: BillingPolicy | null;
  upgrade?: boolean;
};

type BillingEventPayload = {
  action?: string;
  code?: string;
  message?: string;
  billing?: BillingPolicy | null;
  minutesRemaining?: number;
};

function waitForSocketEvent<T>(
  socket: ReturnType<typeof getMeetingSocket>,
  event: string,
  timeoutMs = 12000,
  match?: (payload: T) => boolean,
) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`${event} timed out`));
    }, timeoutMs);

    function handler(payload: T) {
      if (match && !match(payload)) return;

      window.clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    }

    socket.on(event, handler);
  });
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function normalizeParticipants(
  value?: ParticipantState[] | Record<string, ParticipantState>,
) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return Object.values(value);
}

export function useMediasoupRoom(params: {
  enabled: boolean;
  roomId: string;
  userId: string;
  userName: string;
  isHost: boolean;
  recordingMode?: boolean;
  recorderSecret?: string;
}) {
  const {
    enabled,
    roomId,
    userId,
    userName,
    isHost,
    recordingMode = false,
    recorderSecret,
  } = params;

  const socketRef = useRef<ReturnType<typeof getMeetingSocket> | null>(null);
  const [socket, setSocket] = useState<ReturnType<
    typeof getMeetingSocket
  > | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport<AppData> | null>(null);
  const recvTransportRef = useRef<Transport<AppData> | null>(null);
  const audioProducerRef = useRef<Producer<AppData> | null>(null);
  const videoProducerRef = useRef<Producer<AppData> | null>(null);
  const screenProducerRef = useRef<Producer<AppData> | null>(null);
  const consumedProducerIdsRef = useRef<Set<string>>(new Set());
  const pendingProducersRef = useRef<ProducerMeta[]>([]);
  const consumeChainRef = useRef(Promise.resolve());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const startedRef = useRef(false);
  const remoteStreamsRef = useRef<RemoteStream[]>([]);

  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [raisedHands, setRaisedHands] = useState<
    Record<string, { userId: string; userName: string }>
  >({});
  const [participants, setParticipants] = useState<
    Record<string, ParticipantState>
  >({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState("");
  const [recordingNotice, setRecordingNotice] = useState("");
  const [latestRecordingId, setLatestRecordingId] = useState<string | null>(
    null,
  );
  const [recordingStartedAt, setRecordingStartedAt] = useState<string | null>(
    null,
  );
  const [billingNotice, setBillingNotice] = useState<BillingNotice | null>(
    null,
  );
  const [billingPolicy, setBillingPolicy] = useState<BillingPolicy | null>(
    null,
  );

  useEffect(() => {
    remoteStreamsRef.current = remoteStreams;
  }, [remoteStreams]);

  const updateParticipant = useCallback(
    (participant: Partial<ParticipantState> & { userId: string }) => {
      setParticipants((current) => {
        const existing = current[participant.userId];

        return {
          ...current,
          [participant.userId]: {
            userId: participant.userId,
            userName:
              participant.userName ||
              existing?.userName ||
              (participant.userId === userId ? userName : "Participant"),
            micOn:
              typeof participant.micOn === "boolean"
                ? participant.micOn
                : (existing?.micOn ?? true),
            cameraOn:
              typeof participant.cameraOn === "boolean"
                ? participant.cameraOn
                : (existing?.cameraOn ?? true),
            isHost:
              typeof participant.isHost === "boolean"
                ? participant.isHost
                : existing?.isHost,
          },
        };
      });
    },
    [userId, userName],
  );

  const createTransport = useCallback(async (direction: "send" | "recv") => {
    const socket = socketRef.current;
    const device = deviceRef.current;

    if (!socket) throw new Error("Socket is not connected.");
    if (!device) throw new Error("Mediasoup device is not ready.");

    const response = await new Promise<{
      success?: boolean;
      transportParams?: TransportOptions<AppData>;
      direction?: "send" | "recv";
      error?: string;
    }>((resolve) => {
      socket.emit("create-transport", { direction }, resolve);
    });

    if (response?.error || !response?.transportParams) {
      throw new Error(response?.error || "Unable to create transport.");
    }

    return direction === "send"
      ? device.createSendTransport(response.transportParams)
      : device.createRecvTransport(response.transportParams);
  }, []);

  const consumeProducer = useCallback(
    async (meta: ProducerMeta) => {
      consumeChainRef.current = consumeChainRef.current
        .catch(() => undefined)
        .then(async () => {
          const socket = socketRef.current;
          const device = deviceRef.current;
          const recvTransport = recvTransportRef.current;

          if (!meta.producerId) return;
          if (!recordingMode && meta.userId === userId && !meta.isScreen) {
            return;
          }

          if (!socket || !device || !recvTransport) {
            pendingProducersRef.current.push(meta);
            return;
          }

          if (consumedProducerIdsRef.current.has(meta.producerId)) return;
          consumedProducerIdsRef.current.add(meta.producerId);

          try {
            const consumedPromise = waitForSocketEvent<ConsumedPayload>(
              socket,
              "consumed",
              15000,
              (payload) => payload?.producerId === meta.producerId,
            );

            const ack = await new Promise<{
              success?: boolean;
              skipped?: boolean;
              consumerId?: string;
              error?: string;
            }>((resolve) => {
              socket.emit(
                "consume",
                {
                  transportId: recvTransport.id,
                  producerId: meta.producerId,
                  rtpCapabilities: device.rtpCapabilities,
                  appData: {
                    userId,
                    userName,
                  },
                },
                resolve,
              );
            });

            if (ack?.error) {
              consumedProducerIdsRef.current.delete(meta.producerId);
              throw new Error(ack.error);
            }

            if (ack?.skipped) {
              consumedProducerIdsRef.current.delete(meta.producerId);
              return;
            }

            const data = await consumedPromise;

            const consumer = await recvTransport.consume({
              id: data.consumer.id,
              producerId: data.producerId,
              kind: data.consumer.kind,
              rtpParameters: data.consumer.rtpParameters,
              appData: data.consumer.appData,
            });

            const stream = new MediaStream([consumer.track]);
            const remoteUserId = data.consumer.userId || meta.userId;
            const remoteUserName =
              data.consumer.userName || meta.userName || "Participant";
            const isVideo = data.consumer.kind === "video";
            const isAudio = data.consumer.kind === "audio";

            consumer.on("transportclose", () => {
              setRemoteStreams((current) =>
                current.filter((item) => item.id !== consumer.id),
              );
              consumedProducerIdsRef.current.delete(data.producerId);
            });

            consumer.on("producerclose", () => {
              setRemoteStreams((current) =>
                current.filter((item) => item.id !== consumer.id),
              );
              consumedProducerIdsRef.current.delete(data.producerId);

              if (remoteUserId && !meta.isScreen) {
                updateParticipant({
                  userId: remoteUserId,
                  userName: remoteUserName,
                  micOn: isAudio ? false : undefined,
                  cameraOn: isVideo ? false : undefined,
                });
              }
            });

            setRemoteStreams((current) => [
              ...current.filter((item) => item.producerId !== data.producerId),
              {
                id: consumer.id,
                producerId: data.producerId,
                userId: remoteUserId,
                userName: remoteUserName,
                isScreen: Boolean(data.consumer.isScreen || meta.isScreen),
                kind: data.consumer.kind,
                stream,
                micOn: isAudio ? true : undefined,
                cameraOn: isVideo ? true : undefined,
              },
            ]);

            if (remoteUserId && !meta.isScreen) {
              updateParticipant({
                userId: remoteUserId,
                userName: remoteUserName,
                micOn: isAudio ? true : undefined,
                cameraOn: isVideo ? true : undefined,
              });
            }

            socket.emit("resume-consume", {
              consumerId: consumer.id,
            });
          } catch (err) {
            consumedProducerIdsRef.current.delete(meta.producerId);
            throw err;
          }
        });

      return consumeChainRef.current;
    },
    [userId, userName, recordingMode, updateParticipant],
  );

  const setupSendTransport = useCallback(
    (sendTransport: Transport<AppData>) => {
      const socket = socketRef.current;
      if (!socket) return;

      sendTransport.on(
        "connect",
        (
          { dtlsParameters }: { dtlsParameters: DtlsParameters },
          callback: () => void,
          errback: (error: Error) => void,
        ) => {
          socket.emit(
            "connect-transport",
            { transportId: sendTransport.id, dtlsParameters },
            (response: { success?: boolean; error?: string }) => {
              response?.error ? errback(new Error(response.error)) : callback();
            },
          );
        },
      );

      sendTransport.on(
        "produce",
        (
          {
            kind,
            rtpParameters,
            appData,
          }: {
            kind: "audio" | "video";
            rtpParameters: RtpParameters;
            appData: AppData;
          },
          callback: (data: { id: string }) => void,
          errback: (error: Error) => void,
        ) => {
          socket.emit(
            "transport-produce",
            {
              transportId: sendTransport.id,
              kind,
              rtpParameters,
              appData,
            },
            (response: { producerId?: string; error?: string }) => {
              if (response?.error || !response?.producerId) {
                errback(new Error(response?.error || "Produce failed"));
                return;
              }

              callback({ id: response.producerId });
            },
          );
        },
      );
    },
    [],
  );

  const setupRecvTransport = useCallback(
    (recvTransport: Transport<AppData>) => {
      const socket = socketRef.current;
      if (!socket) return;

      recvTransport.on(
        "connect",
        (
          { dtlsParameters }: { dtlsParameters: DtlsParameters },
          callback: () => void,
          errback: (error: Error) => void,
        ) => {
          socket.emit(
            "connect-transport",
            { transportId: recvTransport.id, dtlsParameters },
            (response: { success?: boolean; error?: string }) => {
              response?.error ? errback(new Error(response.error)) : callback();
            },
          );
        },
      );
    },
    [],
  );

  const publishLocalMedia = useCallback(
    async (stream: MediaStream) => {
      const device = deviceRef.current;
      const sendTransport = sendTransportRef.current;

      if (!device || !sendTransport) return;

      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      if (audioTrack && device.canProduce("audio")) {
        audioProducerRef.current = await sendTransport.produce({
          track: audioTrack,
          appData: { userId, userName, isScreen: false },
        });
      }

      if (videoTrack && device.canProduce("video")) {
        videoProducerRef.current = await sendTransport.produce({
          track: videoTrack,
          appData: { userId, userName, isScreen: false },
        });
      }
    },
    [userId, userName],
  );

  const flushPendingProducers = useCallback(async () => {
    const queued = [...pendingProducersRef.current];
    pendingProducersRef.current = [];

    for (const producer of queued) {
      await consumeProducer(producer);
    }
  }, [consumeProducer]);

  const joinAndSetupRoom = useCallback(
    async (stream: MediaStream | null) => {
      const socket = socketRef.current;
      if (!socket) throw new Error("Socket is not connected.");

      updateParticipant({
        userId,
        userName,
        micOn: !recordingMode,
        cameraOn: !recordingMode,
        isHost,
      });

      setStatus("Joining room...");

      const joinResponse = await new Promise<JoinResponse>((resolve) => {
        socket.emit(
          "join",
          {
            roomId,
            userId,
            userName,
            isHost,
            isBot: recordingMode,
            micOn: !recordingMode,
            cameraOn: !recordingMode,
          },
          resolve,
        );
      });

      if (joinResponse?.billing) {
        setBillingPolicy(joinResponse.billing);
      }

      if (!joinResponse?.success || !joinResponse.rtpCapabilities) {
        if (joinResponse?.code || joinResponse?.status === 402) {
          setBillingNotice({
            type: "error",
            title: "Plan limit reached",
            message:
              joinResponse?.message ||
              joinResponse?.error ||
              "Your current plan does not allow this meeting action.",
            code: joinResponse?.code,
            action: "join",
            billing: joinResponse?.billing || null,
            upgrade: true,
          });
        }

        throw new Error(
          joinResponse?.message ||
            joinResponse?.error ||
            "Unable to join meeting.",
        );
      }

      for (const participant of normalizeParticipants(
        joinResponse.participants,
      )) {
        if (!participant.userId) continue;
        updateParticipant(participant);
      }

      const device = new Device();

      await device.load({
        routerRtpCapabilities: joinResponse.rtpCapabilities,
      });

      deviceRef.current = device;

      if (!recordingMode) {
        setStatus("Creating send transport...");
        const sendTransport = await createTransport("send");
        sendTransportRef.current = sendTransport;
        setupSendTransport(sendTransport);
      }

      setStatus("Creating receive transport...");
      const recvTransport = await createTransport("recv");
      recvTransportRef.current = recvTransport;
      setupRecvTransport(recvTransport);

      if (joinResponse.existingProducers?.length) {
        pendingProducersRef.current.push(...joinResponse.existingProducers);
      }

      if (stream && !recordingMode) {
        setStatus("Publishing media...");
        await publishLocalMedia(stream);
      }

      await flushPendingProducers();

      setStatus("Connected");
    },
    [
      roomId,
      userId,
      userName,
      isHost,
      recordingMode,
      createTransport,
      setupSendTransport,
      setupRecvTransport,
      publishLocalMedia,
      flushPendingProducers,
      updateParticipant,
    ],
  );

  const connect = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    setError("");
    let stream: MediaStream | null = null;

    if (recordingMode) {
      setStatus("Connecting recorder...");
      setMicOn(false);
      setCameraOn(false);
    } else {
      setStatus("Requesting camera access...");

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

        setCameraOn(false);
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
    }

    const socket = getMeetingSocket({
      recorderBot: recordingMode,
      recorderSecret,
    });
    socketRef.current = socket;
    setSocket(socket);

    socket.removeAllListeners();

    socket.on("connect", async () => {
      try {
        setConnected(true);
        await joinAndSetupRoom(stream);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Meeting setup failed.");
        setStatus("Failed");
      }
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setStatus("Disconnected");
    });

    socket.on("connect_error", (err) => {
      setConnected(false);
      setError(err.message || "Socket connection failed.");
      setStatus("Connection failed");
    });

    socket.on("existing-producers", (producer: ProducerMeta) => {
      consumeProducer(producer).catch((err) => {
        setError(
          err instanceof Error ? err.message : "Unable to consume media.",
        );
      });
    });

    socket.on("new-producer", (producer: ProducerMeta) => {
      consumeProducer(producer).catch((err) => {
        setError(
          err instanceof Error ? err.message : "Unable to consume media.",
        );
      });
    });

    socket.on("producer-closed", ({ producerId }: { producerId: string }) => {
      const closedStream = remoteStreamsRef.current.find(
        (item) => item.producerId === producerId,
      );

      consumedProducerIdsRef.current.delete(producerId);

      setRemoteStreams((current) =>
        current.filter((item) => item.producerId !== producerId),
      );

      if (closedStream?.userId && !closedStream.isScreen) {
        updateParticipant({
          userId: closedStream.userId,
          userName: closedStream.userName,
          micOn: closedStream.kind === "audio" ? false : undefined,
          cameraOn: closedStream.kind === "video" ? false : undefined,
        });
      }
    });

    socket.on(
      "participant-joined",
      (payload: {
        userId: string;
        userName: string;
        micOn?: boolean;
        cameraOn?: boolean;
        isHost?: boolean;
      }) => {
        updateParticipant({
          userId: payload.userId,
          userName: payload.userName,
          micOn: payload.micOn ?? true,
          cameraOn: payload.cameraOn ?? true,
          isHost: payload.isHost,
        });
      },
    );

    socket.on(
      "participant-media-state",
      (payload: {
        userId: string;
        userName?: string;
        micOn?: boolean;
        cameraOn?: boolean;
      }) => {
        updateParticipant({
          userId: payload.userId,
          userName: payload.userName,
          micOn: payload.micOn,
          cameraOn: payload.cameraOn,
        });

        setRemoteStreams((current) =>
          current.map((remoteStream) => {
            if (remoteStream.userId !== payload.userId) return remoteStream;

            return {
              ...remoteStream,
              micOn:
                typeof payload.micOn === "boolean"
                  ? payload.micOn
                  : remoteStream.micOn,
              cameraOn:
                typeof payload.cameraOn === "boolean"
                  ? payload.cameraOn
                  : remoteStream.cameraOn,
            };
          }),
        );
      },
    );

    socket.on(
      "user-toggle-mic",
      (payload: { userId: string; isMicMuted?: boolean; micOn?: boolean }) => {
        const nextMicOn =
          typeof payload.micOn === "boolean"
            ? payload.micOn
            : !Boolean(payload.isMicMuted);

        updateParticipant({
          userId: payload.userId,
          micOn: nextMicOn,
        });

        setRemoteStreams((current) =>
          current.map((remoteStream) =>
            remoteStream.userId === payload.userId
              ? {
                  ...remoteStream,
                  micOn: nextMicOn,
                }
              : remoteStream,
          ),
        );
      },
    );

    socket.on(
      "user-toggle-camera",
      (payload: {
        userId: string;
        isCameraOff?: boolean;
        cameraOn?: boolean;
      }) => {
        const nextCameraOn =
          typeof payload.cameraOn === "boolean"
            ? payload.cameraOn
            : !Boolean(payload.isCameraOff);

        updateParticipant({
          userId: payload.userId,
          cameraOn: nextCameraOn,
        });

        setRemoteStreams((current) =>
          current.map((remoteStream) =>
            remoteStream.userId === payload.userId
              ? {
                  ...remoteStream,
                  cameraOn: nextCameraOn,
                }
              : remoteStream,
          ),
        );
      },
    );

    socket.on("response-send-message", (message: ChatMessage) => {
      setMessages((current) => [...current, message]);
    });

    socket.on("user-left", ({ userId: leftUserId }: { userId: string }) => {
      setRemoteStreams((current) =>
        current.filter((item) => item.userId !== leftUserId),
      );

      setParticipants((current) => {
        if (!current[leftUserId]) return current;
        const next = { ...current };
        delete next[leftUserId];
        return next;
      });

      setRaisedHands((current) => {
        if (!current[leftUserId]) return current;
        const next = { ...current };
        delete next[leftUserId];
        return next;
      });
    });

    socket.on(
      "screen-share-stopped",
      ({ userId: stoppedUserId }: { userId: string }) => {
        setRemoteStreams((current) =>
          current.filter(
            (item) => !(item.userId === stoppedUserId && item.isScreen),
          ),
        );
      },
    );

    socket.on(
      "recording-started",
      (payload: {
        recordingId: string;
        roomId: string;
        startedAt?: string;
      }) => {
        setRecording(true);
        setRecordingId(payload.recordingId);
        setRecordingStartedAt(payload.startedAt || new Date().toISOString());
        setRecordingError("");
        setRecordingNotice("Recording started.");
        setLatestRecordingId(payload.recordingId);
      },
    );

    socket.on(
      "recording-stopped",
      (payload: { recordingId: string; roomId: string }) => {
        setRecording(false);
        setRecordingId(payload.recordingId);
        setRecordingStartedAt(null);
        setLatestRecordingId(payload.recordingId);
        setRecordingNotice(
          "Recording stopped. Your file is being finalized and will appear in Analytics.",
        );
      },
    );

    socket.on("billing:limit-denied", (payload: BillingEventPayload) => {
      const message =
        payload?.message || "Your current plan does not allow this action.";

      setBillingPolicy(payload?.billing || null);

      setBillingNotice({
        type: "error",
        title:
          payload?.code === "PLAN_RECORDING_DISABLED"
            ? "Recording requires an upgrade"
            : "Plan limit reached",
        message,
        code: payload?.code,
        action: payload?.action,
        billing: payload?.billing || null,
        upgrade: true,
      });

      if (payload?.action === "start-recording") {
        setRecording(false);
        setRecordingError(message);
      } else {
        setError(message);
      }
    });

    socket.on("billing:meeting-warning", (payload: BillingEventPayload) => {
      setBillingPolicy(payload?.billing || null);

      setBillingNotice({
        type: "warning",
        title: "Meeting time limit",
        message:
          payload?.message ||
          "This meeting is close to the time limit for your plan.",
        code: payload?.code,
        action: "meeting-warning",
        billing: payload?.billing || null,
        upgrade: true,
      });
    });

    socket.on("billing:meeting-ended", (payload: BillingEventPayload) => {
      const message =
        payload?.message ||
        "This meeting has ended because it reached the limit for your plan.";

      setBillingPolicy(payload?.billing || null);

      setBillingNotice({
        type: "ended",
        title: "Meeting ended",
        message,
        code: payload?.code,
        action: "meeting-ended",
        billing: payload?.billing || null,
        upgrade: true,
      });

      setRecording(false);
      setRecordingStartedAt(null);
      setStatus("Meeting ended");
      setError(message);
    });

    socket.on(
      "hand-state-changed",
      (payload: {
        roomId: string;
        userId: string;
        userName: string;
        raised: boolean;
      }) => {
        setRaisedHands((current) => {
          const next = { ...current };

          if (payload.raised) {
            next[payload.userId] = {
              userId: payload.userId,
              userName: payload.userName,
            };
          } else {
            delete next[payload.userId];
          }

          return next;
        });
      },
    );

    if (socket.connected) {
      setConnected(true);
      await joinAndSetupRoom(stream);
    } else {
      socket.connect();
    }
  }, [
    joinAndSetupRoom,
    consumeProducer,
    recordingMode,
    recorderSecret,
    updateParticipant,
  ]);

  const leave = useCallback(() => {
    if (!startedRef.current) return;

    const socket = socketRef.current;

    socket?.emit("leave", { roomId, userId });

    audioProducerRef.current?.close();
    videoProducerRef.current?.close();
    screenProducerRef.current?.close();
    sendTransportRef.current?.close();
    recvTransportRef.current?.close();

    stopStream(localStreamRef.current);
    stopStream(screenStreamRef.current);

    audioProducerRef.current = null;
    videoProducerRef.current = null;
    screenProducerRef.current = null;
    sendTransportRef.current = null;
    recvTransportRef.current = null;
    localStreamRef.current = null;
    screenStreamRef.current = null;
    deviceRef.current = null;

    consumedProducerIdsRef.current.clear();
    pendingProducersRef.current = [];
    remoteStreamsRef.current = [];

    setRemoteStreams([]);
    setLocalStream(null);
    setConnected(false);
    setStatus("Left");
    setRaisedHands({});
    setParticipants({});
    setRecording(false);
    setRecordingId(null);
    setRecordingError("");
    setScreenOn(false);
    setMicOn(true);
    setCameraOn(true);
    socketRef.current = null;
    setSocket(null);
    setBillingNotice(null);
    setBillingPolicy(null);

    closeMeetingSocket();
    startedRef.current = false;
  }, [roomId, userId]);

  useEffect(() => {
    if (!enabled) return;

    connect().catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to start meeting.");
      setStatus("Failed");
      startedRef.current = false;
    });

    return () => {
      leave();
    };
  }, [enabled, connect, leave]);

  function toggleMic() {
    const next = !micOn;
    setMicOn(next);

    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });

    updateParticipant({
      userId,
      userName,
      micOn: next,
    });

    socketRef.current?.emit("participant-media-state", {
      roomId,
      userId,
      userName,
      micOn: next,
      cameraOn,
    });

    socketRef.current?.emit("user-toggle-mic", {
      userId,
      isMicMuted: !next,
    });
  }

  function toggleCamera() {
    const next = !cameraOn;
    setCameraOn(next);

    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });

    updateParticipant({
      userId,
      userName,
      cameraOn: next,
    });

    socketRef.current?.emit("participant-media-state", {
      roomId,
      userId,
      userName,
      micOn,
      cameraOn: next,
    });

    socketRef.current?.emit("user-toggle-camera", {
      userId,
      isCameraOff: !next,
    });
  }

  async function toggleScreenShare() {
    if (screenOn) {
      screenProducerRef.current?.close();
      screenProducerRef.current = null;

      stopStream(screenStreamRef.current);
      screenStreamRef.current = null;

      socketRef.current?.emit("stop-screen-share", {
        userId,
        screenProducerIds: [],
      });

      setScreenOn(false);
      return;
    }

    const sendTransport = sendTransportRef.current;
    if (!sendTransport) return;

    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    const screenTrack = screenStream.getVideoTracks()[0];
    screenStreamRef.current = screenStream;

    screenProducerRef.current = await sendTransport.produce({
      track: screenTrack,
      appData: { userId, userName, isScreen: true },
    });

    screenTrack.onended = () => {
      setScreenOn(false);
      screenProducerRef.current?.close();
      screenProducerRef.current = null;

      socketRef.current?.emit("stop-screen-share", {
        userId,
        screenProducerIds: [],
      });
    };

    setScreenOn(true);
  }

  function sendMessage(message: string) {
    const clean = message.trim();
    const socket = socketRef.current;

    if (!clean || !socket?.connected || !socket.id) return;

    socket.emit("send-message", {
      roomId,
      message: clean,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      userName,
      socketId: socket.id,
      messageId: crypto.randomUUID(),
    });
  }

  function startRecording() {
    const socket = socketRef.current;

    if (!socket?.connected) {
      setRecordingError("Meeting socket is not connected.");
      return;
    }

    if (!localStreamRef.current) {
      setRecordingError(
        "Wait until your camera or microphone is ready before recording.",
      );
      return;
    }

    if (!isHost) {
      setRecordingError("Only the host can start recording.");
      return;
    }

    setRecordingError("");

    socket.emit(
      "start-recording",
      {},
      (response: {
        success?: boolean;
        error?: string;
        data?: { recordingId: string; startedAt?: string };
      }) => {
        if (!response?.success) {
          const message = response?.error || "Unable to start recording.";

          setRecording(false);
          setRecordingError(message);

          if ((response as any)?.code || (response as any)?.status === 402) {
            setBillingNotice({
              type: "error",
              title: "Recording requires an upgrade",
              message,
              code: (response as any)?.code,
              action: "start-recording",
              billing: (response as any)?.billing || null,
              upgrade: true,
            });
          }

          return;
        }

        setRecording(true);
        setRecordingId(response.data?.recordingId || null);
        setRecordingStartedAt(
          response.data?.startedAt || new Date().toISOString(),
        );
      },
    );
  }

  function stopRecording() {
    const socket = socketRef.current;

    if (!socket?.connected) {
      setRecordingError("Meeting socket is not connected.");
      return;
    }

    if (!isHost) {
      setRecordingError("Only the host can stop recording.");
      return;
    }

    setRecordingError("");

    socket.emit(
      "stop-recording",
      {},
      (response: {
        success?: boolean;
        error?: string;
        data?: { recordingId: string };
      }) => {
        if (!response?.success) {
          setRecordingError(response?.error || "Unable to stop recording.");
          return;
        }

        setRecording(false);
        setRecordingId(response.data?.recordingId || recordingId);
        setLatestRecordingId(response.data?.recordingId || recordingId);
        setRecordingNotice(
          "Recording stopped. Your file is being finalized and will appear in Analytics.",
        );
        setRecordingStartedAt(null);
      },
    );
  }

  function toggleHand() {
    const socket = socketRef.current;

    if (!socket?.connected) {
      setError("Meeting socket is not connected.");
      return;
    }

    const isRaised = Boolean(raisedHands[userId]);
    const event = isRaised ? "lower-hand" : "raise-hand";

    socket.emit(
      event,
      {
        roomId,
        userId,
        userName,
      },
      (response: { success?: boolean; error?: string }) => {
        if (!response?.success) {
          setError(response?.error || "Unable to update hand status.");
        }
      },
    );
  }

  return {
    status,
    error,
    connected,
    socket,
    localStream,
    remoteStreams,
    participants,
    messages,
    micOn,
    cameraOn,
    screenOn,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendMessage,
    leave,
    recording,
    recordingId,
    recordingError,
    recordingNotice,
    latestRecordingId,
    startRecording,
    stopRecording,
    recordingStartedAt,
    recordingMode,
    joinAndSetupRoom,
    raisedHands,
    toggleHand,
    billingNotice,
    billingPolicy,
    clearBillingNotice: () => setBillingNotice(null),
  };
}
