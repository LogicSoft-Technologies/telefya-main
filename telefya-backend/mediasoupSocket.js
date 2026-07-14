const {
  setupMediasoup,
  setIo,
  setPubSub,
  joinRoom,
  createTransport,
  connectTransport,
  produce,
  consume,
  stopScreenShare,
  leaveRoom,
  savePeerRtpCapabilities,
  resumeConsumer,
  stopConsumerScreenSharing,
  rooms,
} = require("./mediasoupServer2");

const { breakoutManager } = require("./breakoutRoomManager");
const {
  start_browser_recording_service,
  stop_browser_recording_service,
  get_active_browser_recording,
} = require("./services/13-browser_recording_service");

const { query } = require("./config/db");
const {
  start_attendance_service,
  finish_attendance_service,
} = require("./services/09-analytics_service");

const {
  get_current_subscription_service,
  get_usage_entitlement_service,
} = require("./services/14-billing_service");

module.exports = async function mediasoupSocket(io, pubClient, subClient) {
  setIo(io);
  await setupMediasoup(pubClient, subClient);
  setPubSub(pubClient, subClient);

  const pendingJoinRequests = new Map();
  const roomParticipants = new Map();

  const roomBillingPolicies = new Map();
  const roomLimitTimers = new Map();

  const DEFAULT_FREE_LIMITS = {
    max_meeting_minutes: 40,
    max_participants: 4,
    monthly_recording_minutes: 0,
    storage_gb: 0,
    recording_enabled: false,
    analytics_enabled: false,
    priority_support: false,
  };

  function normalizeLimitNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  function getFallbackSubscription(userId) {
    return {
      user_id: userId,
      plan_code: "free",
      plan_name: "Free",
      status: "free",
      limits: { ...DEFAULT_FREE_LIMITS },
    };
  }

  function normalizeSubscription(subscription, userId) {
    const fallback = getFallbackSubscription(userId);
    const limits = subscription?.limits || {};

    return {
      ...fallback,
      ...subscription,
      user_id: subscription?.user_id || userId,
      plan_code: subscription?.plan_code || fallback.plan_code,
      plan_name: subscription?.plan_name || fallback.plan_name,
      status: subscription?.status || fallback.status,
      limits: {
        max_meeting_minutes: normalizeLimitNumber(
          limits.max_meeting_minutes,
          DEFAULT_FREE_LIMITS.max_meeting_minutes,
        ),
        max_participants: normalizeLimitNumber(
          limits.max_participants,
          DEFAULT_FREE_LIMITS.max_participants,
        ),
        monthly_recording_minutes: Number(
          limits.monthly_recording_minutes ??
            DEFAULT_FREE_LIMITS.monthly_recording_minutes,
        ),
        storage_gb: Number(limits.storage_gb ?? DEFAULT_FREE_LIMITS.storage_gb),
        recording_enabled: Boolean(limits.recording_enabled),
        analytics_enabled: Boolean(limits.analytics_enabled),
        priority_support: Boolean(limits.priority_support),
      },
    };
  }

  async function getUserSubscription(userId) {
    if (!userId) return getFallbackSubscription(userId);

    try {
      const result = await get_current_subscription_service(query, userId);
      return normalizeSubscription(result?.data, userId);
    } catch (error) {
      console.error("[Billing] Unable to load subscription:", {
        userId,
        message: error?.message,
      });

      return getFallbackSubscription(userId);
    }
  }

  function publicBillingPolicy(policy) {
    if (!policy) return null;

    return {
      roomId: policy.roomId,
      hostUserId: policy.hostUserId,
      hostUserName: policy.hostUserName,
      plan_code: policy.plan_code,
      plan_name: policy.plan_name,
      status: policy.status,
      startedAt: policy.startedAt,
      limits: policy.limits,
    };
  }

  async function resolveRoomBillingPolicy({
    roomId,
    userId,
    userName,
    isHost = false,
    force = false,
  }) {
    const existing = roomBillingPolicies.get(roomId);

    if (existing && !force) {
      if (!isHost || String(existing.hostUserId) === String(userId)) {
        return existing;
      }
    }

    if (existing && !isHost && !force) {
      return existing;
    }

    const subscription = await getUserSubscription(userId);

    const policy = {
      roomId,
      hostUserId: userId,
      hostUserName: userName || "Host",
      plan_code: subscription.plan_code,
      plan_name: subscription.plan_name,
      status: subscription.status,
      limits: subscription.limits,
      startedAt: existing?.startedAt || new Date().toISOString(),
      createdAtMs: existing?.createdAtMs || Date.now(),
    };

    roomBillingPolicies.set(roomId, policy);
    return policy;
  }

  function buildBillingDenial({ code, message, policy, status = 402 }) {
    return {
      success: false,
      error: message,
      message,
      status,
      code,
      billing: publicBillingPolicy(policy),
    };
  }

  function emitBillingDenial(socket, action, denial, callback) {
    socket.emit("billing:limit-denied", {
      action,
      ...denial,
    });

    if (typeof callback === "function") {
      callback(denial);
    }
  }

  function getBillableParticipantCount(roomId) {
    return listRoomParticipants(roomId).length;
  }

  function canJoinByParticipantLimit(roomId, userId, policy) {
    const participants = getRoomParticipants(roomId);
    const alreadyJoined = participants.has(userId);
    const currentCount = getBillableParticipantCount(roomId);
    const maxParticipants = normalizeLimitNumber(
      policy?.limits?.max_participants,
      DEFAULT_FREE_LIMITS.max_participants,
    );

    if (!alreadyJoined && currentCount >= maxParticipants) {
      return {
        allowed: false,
        code: "PLAN_PARTICIPANT_LIMIT",
        message:
          "This meeting has reached the " +
          maxParticipants +
          "-participant limit for the " +
          (policy?.plan_name || "current") +
          " plan.",
      };
    }

    return { allowed: true };
  }

  async function canStartRecordingByUsage(policy) {
    const hostUserId = policy?.hostUserId;

    if (!hostUserId) {
      return {
        allowed: false,
        code: "PLAN_RECORDING_USAGE_UNKNOWN",
        message: "Unable to verify recording usage for this workspace.",
      };
    }

    let entitlement;

    try {
      const result = await get_usage_entitlement_service(query, hostUserId);
      entitlement = result?.data;
    } catch (error) {
      console.error("[Billing] Unable to verify recording entitlement:", {
        hostUserId,
        message: error?.message,
      });

      return {
        allowed: false,
        code: "PLAN_RECORDING_USAGE_UNKNOWN",
        message:
          "Unable to verify your recording allowance. Please try again in a moment.",
      };
    }

    const remainingRecordingMinutes = Number(
      entitlement?.remaining?.recording_minutes || 0,
    );

    const remainingStorageBytes = Number(
      entitlement?.remaining?.storage_bytes || 0,
    );

    if (
      entitlement?.exceeded?.recording_minutes ||
      remainingRecordingMinutes <= 0
    ) {
      return {
        allowed: false,
        code: "PLAN_RECORDING_LIMIT",
        message:
          "You have used all recording minutes included in the " +
          (policy?.plan_name || "current") +
          " plan for this billing period.",
        entitlement,
      };
    }

    if (entitlement?.exceeded?.storage || remainingStorageBytes <= 0) {
      return {
        allowed: false,
        code: "PLAN_STORAGE_LIMIT",
        message:
          "Your workspace storage allowance is full. Free up storage or upgrade your plan to record more meetings.",
        entitlement,
      };
    }

    return {
      allowed: true,
      entitlement,
    };
  }

  function clearRoomBillingState(roomId) {
    const timers = roomLimitTimers.get(roomId);

    if (timers) {
      clearTimeout(timers.warningTimer);
      clearTimeout(timers.endTimer);
      roomLimitTimers.delete(roomId);
    }

    roomBillingPolicies.delete(roomId);
  }

  async function stopActiveRecordingForRoom(roomId) {
    if (!roomId || !get_active_browser_recording(roomId)) return;

    try {
      const result = await stop_browser_recording_service({
        db_query: query,
        roomId,
      });

      if (result.success) {
        io.to(roomId).emit("recording-stopped", {
          ...result.data,
          roomId,
          stoppedBy: "billing_limit",
        });
      }
    } catch (error) {
      console.error("[Billing] Unable to stop recording after plan limit:", {
        roomId,
        message: error?.message,
      });
    }
  }

  function scheduleRoomDurationLimit(roomId, policy) {
    if (!roomId || !policy || roomLimitTimers.has(roomId)) return;

    const maxMeetingMinutes = normalizeLimitNumber(
      policy.limits?.max_meeting_minutes,
      DEFAULT_FREE_LIMITS.max_meeting_minutes,
    );

    const limitMs = maxMeetingMinutes * 60 * 1000;
    const warningMinutes = Math.min(5, Math.max(1, maxMeetingMinutes - 1));
    const warningMs = Math.max(0, limitMs - warningMinutes * 60 * 1000);

    const warningTimer = setTimeout(() => {
      io.to(roomId).emit("billing:meeting-warning", {
        roomId,
        code: "PLAN_MEETING_TIME_WARNING",
        message:
          "This meeting will end in " +
          warningMinutes +
          " minute" +
          (warningMinutes === 1 ? "" : "s") +
          " on the " +
          policy.plan_name +
          " plan.",
        minutesRemaining: warningMinutes,
        billing: publicBillingPolicy(policy),
      });
    }, warningMs);

    const endTimer = setTimeout(async () => {
      const latestPolicy = roomBillingPolicies.get(roomId) || policy;

      io.to(roomId).emit("billing:meeting-ended", {
        roomId,
        code: "PLAN_MEETING_TIME_LIMIT",
        message:
          "This meeting has reached the " +
          maxMeetingMinutes +
          "-minute limit for the " +
          latestPolicy.plan_name +
          " plan.",
        billing: publicBillingPolicy(latestPolicy),
      });

      await stopActiveRecordingForRoom(roomId);

      try {
        io.in(roomId).disconnectSockets(true);
      } catch (error) {
        console.error("[Billing] Unable to disconnect room after limit:", {
          roomId,
          message: error?.message,
        });
      }

      clearRoomBillingState(roomId);
    }, limitMs);

    warningTimer.unref?.();
    endTimer.unref?.();

    roomLimitTimers.set(roomId, {
      warningTimer,
      endTimer,
      maxMeetingMinutes,
    });
  }

  function getRoomParticipants(roomId) {
    if (!roomParticipants.has(roomId)) {
      roomParticipants.set(roomId, new Map());
    }

    return roomParticipants.get(roomId);
  }

  function listRoomParticipants(roomId) {
    return Array.from(getRoomParticipants(roomId).values());
  }

  function upsertRoomParticipant(roomId, participant) {
    if (!roomId || !participant?.userId) return;

    const participants = getRoomParticipants(roomId);
    const existing = participants.get(participant.userId) || {};

    participants.set(participant.userId, {
      userId: participant.userId,
      userName: participant.userName || existing.userName || "Participant",
      micOn:
        typeof participant.micOn === "boolean"
          ? participant.micOn
          : (existing.micOn ?? true),
      cameraOn:
        typeof participant.cameraOn === "boolean"
          ? participant.cameraOn
          : (existing.cameraOn ?? true),
      isHost:
        typeof participant.isHost === "boolean"
          ? participant.isHost
          : existing.isHost || false,
    });
  }

  function removeRoomParticipant(roomId, userId) {
    if (!roomId || !userId) return;

    const participants = getRoomParticipants(roomId);
    participants.delete(userId);

    if (participants.size === 0) {
      roomParticipants.delete(roomId);
      clearRoomBillingState(roomId);
    }
  }

  function getRoomProducerCount(roomId) {
    const room = rooms.get(roomId);
    if (!room) return 0;

    let count = 0;

    for (const [, peer] of room.peers) {
      count += peer.producers?.size || 0;
    }

    return count;
  }

  io.on("connection", (socket) => {
    socket.on("request-join", (data, callback) => {
      const { roomId, userId, userName, isHost } = data;

      if (isHost) {
        io.emit("host-joined", { userId, userName, roomId });
        callback({ message: "You are the host", roomIsEmpty: false });
        return;
      }

      if (!rooms.has(roomId)) {
        callback({
          message:
            "Room is empty. Please wait for the host to start the meeting.",
          roomIsEmpty: true,
        });
        return;
      }

      pendingJoinRequests.set(userId, socket.id);
      io.to(roomId).emit("request-joined", { userId, userName });
    });

    socket.on("response-join", (data) => {
      const { status, roomId, userId, userName } = data;
      const targetSocketId = pendingJoinRequests.get(userId);

      if (targetSocketId) {
        io.to(targetSocketId).emit("response-joined", {
          status,
          userId,
          userName,
          roomId,
        });
      } else {
        io.emit("response-joined", { status, userId, userName, roomId });
      }

      pendingJoinRequests.delete(userId);
    });

    socket.on(
      "join",
      async (
        {
          roomId,
          userId,
          userName,
          isHost = false,
          isBot = false,
          micOn = true,
          cameraOn = true,
        },
        cb,
      ) => {
        try {
          if (!roomId || !userId) {
            const error = "roomId and userId are required";

            if (typeof cb === "function") {
              cb({ success: false, error });
            }

            socket.emit("error", {
              action: "join",
              error,
            });

            return;
          }

          const initialBillingPolicy = await resolveRoomBillingPolicy({
            roomId,
            userId,
            userName,
            isHost: Boolean(isHost),
          });

          if (!isBot) {
            const participantAccess = canJoinByParticipantLimit(
              roomId,
              userId,
              initialBillingPolicy,
            );

            if (!participantAccess.allowed) {
              pendingJoinRequests.delete(userId);

              const denial = buildBillingDenial({
                code: participantAccess.code,
                message: participantAccess.message,
                policy: initialBillingPolicy,
              });

              emitBillingDenial(socket, "join", denial, cb);

              socket.emit("error", {
                action: "join",
                error: denial.message,
                code: denial.code,
              });

              return;
            }
          }

          socket.data = {
            roomId,
            userId,
            userName,
            isHost,
            isBot,
            micOn: isBot ? false : Boolean(micOn),
            cameraOn: isBot ? false : Boolean(cameraOn),
            billing: publicBillingPolicy(initialBillingPolicy),
            transports: new Map(),
          };

          socket.join(roomId);

          if (!isBot) {
            socket.data.attendanceId = await start_attendance_service(query, {
              roomId,
              userId,
              userName,
            });
          }

          const joinResult = await joinRoom(
            socket,
            roomId,
            userId,
            userName,
            isHost,
          );

          socket.data.isHost = joinResult.isHost;

          const activeBillingPolicy = await resolveRoomBillingPolicy({
            roomId,
            userId,
            userName,
            isHost: Boolean(joinResult.isHost),
            force: Boolean(joinResult.isHost),
          });

          socket.data.billing = publicBillingPolicy(activeBillingPolicy);
          scheduleRoomDurationLimit(roomId, activeBillingPolicy);

          if (!isBot) {
            pendingJoinRequests.delete(userId);

            upsertRoomParticipant(roomId, {
              userId,
              userName,
              micOn: Boolean(micOn),
              cameraOn: Boolean(cameraOn),
              isHost: joinResult.isHost,
            });
          }

          const payload = {
            roomId,
            rtpCapabilities: joinResult.rtpCapabilities,
            userName,
            userId,
            isHost: joinResult.isHost,
            participants: listRoomParticipants(roomId),
            billing: socket.data.billing,
          };

          if (typeof cb === "function") {
            cb({
              success: true,
              ...payload,
            });
          }

          socket.emit("joined", payload);

          if (!isBot) {
            socket.to(roomId).emit("participant-joined", {
              roomId,
              userId,
              userName,
              micOn: Boolean(micOn),
              cameraOn: Boolean(cameraOn),
              isHost: joinResult.isHost,
            });
          }
        } catch (err) {
          console.error(
            `Error joining room ${roomId} for user ${userId}:`,
            err,
          );

          if (typeof cb === "function") {
            cb({ success: false, error: err.message });
          }

          socket.emit("error", {
            action: "join",
            error: err.message,
          });
        }
      },
    );

    socket.on("create-transport", async ({ direction }, callback) => {
      const { roomId, userId, userName } = socket.data || {};

      if (
        socket.data?.isBot ||
        socket.data?.isRecorderBot ||
        userName === "Recorder Bot" ||
        userName === "Telefya Recorder"
      ) {
        if (direction !== "recv") {
          const error = "Bot: no send transport";

          if (typeof callback === "function") {
            callback({ error });
          }

          return socket.emit("transport-created", { error });
        }
      }

      if (!roomId || !userId) {
        const error = "Missing roomId or userId in socket data";

        socket.emit("error", {
          action: "create-transport",
          error,
        });

        if (typeof callback === "function") {
          callback({ error });
        }

        return;
      }

      try {
        const transport = await createTransport(roomId, userId);

        if (!socket.data.transports) {
          socket.data.transports = new Map();
        }

        socket.data.transports.set(transport.id, direction);

        const payload = {
          transportParams: transport,
          direction,
        };

        socket.emit("transport-created", payload);

        if (typeof callback === "function") {
          callback({ success: true, ...payload });
        }

        if (direction === "recv") {
          const room = rooms.get(roomId);

          if (room) {
            for (const [, peer] of room.peers) {
              for (const producer of peer.producers.values()) {
                if (producer.appData?.userId === userId) continue;
                if (producer.appData?.userName === "Recorder Bot") continue;
                if (producer.appData?.userName === "Telefya Recorder") continue;

                socket.emit("existing-producers", {
                  producerId: producer.id,
                  kind: producer.kind,
                  isScreen: Boolean(producer.appData?.isScreen),
                  userId: producer.appData?.userId,
                  userName: producer.appData?.userName,
                  appData: producer.appData || {},
                  screenSharingUser: room.screenSharingUser || null,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error(
          `Error creating transport for user ${userId} in room ${roomId}:`,
          err,
        );

        socket.emit("error", {
          action: "create-transport",
          error: err.message,
        });

        if (typeof callback === "function") {
          callback({ error: err.message });
        }
      }
    });

    socket.on(
      "connect-transport",
      async ({ transportId, dtlsParameters }, callback) => {
        const { roomId, userId } = socket.data || {};

        if (!roomId || !userId) {
          const error = "Missing roomId or userId";

          socket.emit("error", {
            action: "connect-transport",
            error,
          });

          return typeof callback === "function" && callback({ error });
        }

        try {
          await connectTransport(roomId, userId, transportId, dtlsParameters);
          socket.emit("transport-connected", { transportId });
          typeof callback === "function" && callback({ success: true });
        } catch (err) {
          console.error(
            `connect-transport: Error for transport ${transportId}, user ${userId}, room ${roomId}:`,
            err.message,
          );

          socket.emit("error", {
            action: "connect-transport",
            error: err.message,
          });

          typeof callback === "function" && callback({ error: err.message });
        }
      },
    );

    socket.on(
      "transport-produce",
      async ({ transportId, kind, rtpParameters, appData = {} }, callback) => {
        const { roomId, userId, userName } = socket.data || {};

        if (!roomId || !userId) {
          const error = "Missing roomId or userId";
          socket.emit("error", { action: "transport-produce", error });
          return typeof callback === "function" && callback({ error });
        }

        try {
          const producerAppData = {
            ...appData,
            userId: appData.userId || userId,
            userName: appData.userName || userName,
            isScreen: Boolean(appData.isScreen),
          };

          const producerId = await produce(
            roomId,
            transportId,
            kind,
            rtpParameters,
            producerAppData,
          );

          const room = rooms.get(roomId);

          if (kind === "audio" && !producerAppData.isScreen) {
            socket.data.micOn = true;

            upsertRoomParticipant(roomId, {
              userId,
              userName,
              micOn: true,
            });

            io.to(roomId).emit("participant-media-state", {
              roomId,
              userId,
              userName,
              micOn: true,
              cameraOn: socket.data.cameraOn,
            });
          }

          if (kind === "video" && !producerAppData.isScreen) {
            socket.data.cameraOn = true;

            upsertRoomParticipant(roomId, {
              userId,
              userName,
              cameraOn: true,
            });

            io.to(roomId).emit("participant-media-state", {
              roomId,
              userId,
              userName,
              micOn: socket.data.micOn,
              cameraOn: true,
            });
          }

          if (typeof callback === "function") {
            callback({ producerId });
          }

          socket.to(roomId).emit("new-producer", {
            producerId,
            kind,
            appData: producerAppData,
            userId: producerAppData.userId,
            userName: producerAppData.userName,
            isScreen: producerAppData.isScreen,
            screenSharingUser: room?.screenSharingUser || null,
          });
        } catch (err) {
          console.error(`transport-produce: Error for room ${roomId}:`, err);

          socket.emit("error", {
            action: "transport-produce",
            error: err.message,
          });

          if (typeof callback === "function") {
            callback({ error: err.message });
          }
        }
      },
    );

    socket.on(
      "consume",
      async (
        { transportId, producerId, rtpCapabilities, appData = {} },
        callback,
      ) => {
        const { roomId, userId } = socket.data || {};

        if (!roomId || !userId) {
          const error = "Missing roomId or userId";
          socket.emit("error", { action: "consume", error });
          return typeof callback === "function" && callback({ error });
        }

        try {
          const consumer = await consume(
            roomId,
            userId,
            transportId,
            producerId,
            rtpCapabilities,
            appData,
          );

          if (!consumer) {
            return (
              typeof callback === "function" &&
              callback({ success: true, skipped: true })
            );
          }

          socket.emit("consumed", {
            consumer: {
              id: consumer.id,
              producerId,
              kind: consumer.kind,
              rtpParameters: consumer.rtpParameters,
              userId: consumer.userId,
              userName: consumer.userName,
              isScreen: consumer.isScreen,
              appData: consumer.appData,
            },
            producerId,
            appData: consumer.appData,
          });

          await resumeConsumer(roomId, userId, consumer.id);

          if (typeof callback === "function") {
            callback({ success: true, consumerId: consumer.id });
          }
        } catch (err) {
          socket.emit("error", {
            action: "consume",
            error: err.message,
          });

          if (typeof callback === "function") {
            callback({ error: err.message });
          }
        }
      },
    );

    socket.on("resume-consume", async ({ consumerId }, callback) => {
      const { roomId, userId } = socket.data || {};

      if (!roomId || !userId || !consumerId) {
        const error = "Missing roomId, userId or consumerId";

        socket.emit("error", {
          action: "resume-consumer",
          error,
        });

        if (typeof callback === "function") {
          callback({ error });
        }

        return;
      }

      try {
        await resumeConsumer(roomId, userId, consumerId);

        socket.emit("consumer-resumed", { consumerId });

        if (typeof callback === "function") {
          callback({ success: true });
        }
      } catch (err) {
        socket.emit("error", {
          action: "resume-consumer",
          error: err.message,
        });

        if (typeof callback === "function") {
          callback({ error: err.message });
        }
      }
    });

    socket.on("mute-all", ({ roomId, userId, mute }) => {
      io.to(roomId).emit("muted-all", { roomId, userId, mute });
    });

    socket.on("stop-my-consumer-for-screen-share", async ({ userId }) => {
      const { roomId } = socket.data || {};

      try {
        await stopConsumerScreenSharing(roomId, userId);
        socket.emit("screen-share-consumer-stopped", { userId });
      } catch (err) {
        socket.emit("error", {
          action: "stop-my-consumer-for-screen-share",
          error: err.message,
        });
      }
    });

    socket.on("raise-hand", ({ roomId, userId, userName }, callback) => {
      const safeRoomId = roomId || socket.data?.roomId;
      const safeUserId = userId || socket.data?.userId;
      const safeUserName = userName || socket.data?.userName || "Participant";

      if (!safeRoomId || !safeUserId) {
        return callback?.({
          success: false,
          error: "Missing room or user.",
        });
      }

      socket.data.handRaised = true;

      io.to(safeRoomId).emit("hand-state-changed", {
        roomId: safeRoomId,
        userId: safeUserId,
        userName: safeUserName,
        raised: true,
      });

      return callback?.({ success: true });
    });

    socket.on("lower-hand", ({ roomId, userId, userName }, callback) => {
      const safeRoomId = roomId || socket.data?.roomId;
      const safeUserId = userId || socket.data?.userId;
      const safeUserName = userName || socket.data?.userName || "Participant";

      if (!safeRoomId || !safeUserId) {
        return callback?.({
          success: false,
          error: "Missing room or user.",
        });
      }

      socket.data.handRaised = false;

      io.to(safeRoomId).emit("hand-state-changed", {
        roomId: safeRoomId,
        userId: safeUserId,
        userName: safeUserName,
        raised: false,
      });

      return callback?.({ success: true });
    });

    socket.on("user-toggle-mic", async ({ isMicMuted, userId }) => {
      const safeRoomId = socket.data?.roomId;
      const safeUserId = userId || socket.data?.userId;
      const safeUserName = socket.data?.userName || "Participant";
      const micOn = !Boolean(isMicMuted);

      if (!safeRoomId || !safeUserId) return;

      socket.data.micOn = micOn;

      upsertRoomParticipant(safeRoomId, {
        userId: safeUserId,
        userName: safeUserName,
        micOn,
      });

      io.to(safeRoomId).emit("user-toggle-mic", {
        roomId: safeRoomId,
        userId: safeUserId,
        userName: safeUserName,
        isMicMuted: !micOn,
        micOn,
      });

      io.to(safeRoomId).emit("participant-media-state", {
        roomId: safeRoomId,
        userId: safeUserId,
        userName: safeUserName,
        micOn,
        cameraOn: socket.data?.cameraOn,
      });
    });

    socket.on("user-toggle-camera", async ({ isCameraOff, userId }) => {
      const safeRoomId = socket.data?.roomId;
      const safeUserId = userId || socket.data?.userId;
      const safeUserName = socket.data?.userName || "Participant";
      const cameraOn = !Boolean(isCameraOff);

      if (!safeRoomId || !safeUserId) return;

      socket.data.cameraOn = cameraOn;

      upsertRoomParticipant(safeRoomId, {
        userId: safeUserId,
        userName: safeUserName,
        cameraOn,
      });

      io.to(safeRoomId).emit("user-toggle-camera", {
        roomId: safeRoomId,
        userId: safeUserId,
        userName: safeUserName,
        isCameraOff: !cameraOn,
        cameraOn,
      });

      io.to(safeRoomId).emit("participant-media-state", {
        roomId: safeRoomId,
        userId: safeUserId,
        userName: safeUserName,
        micOn: socket.data?.micOn,
        cameraOn,
      });
    });

    socket.on(
      "participant-media-state",
      ({ roomId, userId, userName, micOn, cameraOn }) => {
        const safeRoomId = roomId || socket.data?.roomId;
        const safeUserId = userId || socket.data?.userId;
        const safeUserName = userName || socket.data?.userName || "Participant";

        if (!safeRoomId || !safeUserId) return;

        if (typeof micOn === "boolean") socket.data.micOn = micOn;
        if (typeof cameraOn === "boolean") socket.data.cameraOn = cameraOn;

        upsertRoomParticipant(safeRoomId, {
          userId: safeUserId,
          userName: safeUserName,
          micOn,
          cameraOn,
        });

        io.to(safeRoomId).emit("participant-media-state", {
          roomId: safeRoomId,
          userId: safeUserId,
          userName: safeUserName,
          micOn,
          cameraOn,
        });
      },
    );

    socket.on("stop-screen-share", async ({ userId, screenProducerIds }) => {
      const { roomId } = socket.data || {};

      try {
        await stopScreenShare(roomId, userId, screenProducerIds);

        io.to(roomId).emit("screen-share-stopped", {
          userId,
          message: `User ${userId} has stopped screen sharing`,
        });
      } catch (err) {
        socket.emit("error", {
          action: "stop-screen-share",
          error: err.message,
        });
      }
    });

    socket.on("leave", async (payload = {}, callback) => {
      const roomId = socket.data?.roomId || payload.roomId;
      const userId = socket.data?.userId || payload.userId;

      if (!roomId || !userId) {
        const error = "Missing roomId or userId";

        if (typeof callback === "function") {
          callback({ error });
        }

        return;
      }

      try {
        socket.to(roomId).emit("user-left", {
          userId,
          message: `User ${userId} has left the room`,
        });

        if (socket.data?.isHost && get_active_browser_recording(roomId)) {
          const result = await stop_browser_recording_service({
            db_query: query,
            roomId,
          });

          if (result.success) {
            io.to(roomId).emit("recording-stopped", {
              ...result.data,
              roomId,
            });
          }
        }

        removeRoomParticipant(roomId, userId);

        await finish_attendance_service(query, {
          attendanceId: socket.data?.attendanceId,
          roomId,
          userId,
        });

        if (socket.data?.roomId && socket.data?.userId) {
          io.to(socket.data.roomId).emit("hand-state-changed", {
            roomId: socket.data.roomId,
            userId: socket.data.userId,
            userName: socket.data.userName || "Participant",
            raised: false,
          });
        }

        await leaveRoom(roomId, userId);

        socket.leave(roomId);
        socket.data = {};

        if (typeof callback === "function") {
          callback({ success: true });
        }
      } catch (err) {
        socket.emit("error", {
          action: "leave",
          error: err.message,
        });

        if (typeof callback === "function") {
          callback({ error: err.message });
        }
      }
    });

    socket.on("disconnect", async () => {
      const { roomId, userId } = socket.data || {};

      for (const [pendingUserId, socketId] of pendingJoinRequests.entries()) {
        if (socketId === socket.id) {
          pendingJoinRequests.delete(pendingUserId);
        }
      }

      if (roomId && userId) {
        try {
          socket.to(roomId).emit("user-left", {
            userId,
            message: `User ${userId} has disconnected`,
          });

          if (socket.data?.isHost && get_active_browser_recording(roomId)) {
            const result = await stop_browser_recording_service({
              db_query: query,
              roomId,
            });

            if (result.success) {
              io.to(roomId).emit("recording-stopped", {
                ...result.data,
                roomId,
              });
            }
          }

          removeRoomParticipant(roomId, userId);

          await finish_attendance_service(query, {
            attendanceId: socket.data?.attendanceId,
            roomId,
            userId,
          });

          if (socket.data?.roomId && socket.data?.userId) {
            io.to(socket.data.roomId).emit("hand-state-changed", {
              roomId: socket.data.roomId,
              userId: socket.data.userId,
              userName: socket.data.userName || "Participant",
              raised: false,
            });
          }

          await leaveRoom(roomId, userId);
        } catch (err) {
          console.error(
            `Error during disconnect cleanup for user ${userId}:`,
            err,
          );
        }
      }
    });

    socket.on(
      "send-message",
      ({ roomId, message, time, userName, socketId, messageId }) => {
        io.to(roomId).emit("response-send-message", {
          roomId,
          message,
          time,
          userName,
          socketId,
          messageId,
        });
      },
    );

    socket.on("edit-message", ({ roomId, messageId, newMessage, socketId }) => {
      io.to(roomId).emit("response-edit-message", {
        roomId,
        messageId,
        newMessage,
        socketId,
      });
    });

    socket.on("delete-message", ({ roomId, messageId }) => {
      io.to(roomId).emit("response-delete-message", {
        roomId,
        messageId,
      });
    });

    socket.on("save-rtp-capabilities", async ({ rtpCapabilities }) => {
      const { roomId, userId } = socket.data || {};

      try {
        await savePeerRtpCapabilities(roomId, userId, rtpCapabilities);
      } catch (err) {
        console.error(
          `Error saving rtpCapabilities for user ${userId} in room ${roomId}:`,
          err,
        );

        socket.emit("error", {
          action: "save-rtp-capabilities",
          error: err.message,
        });
      }
    });

    socket.on(
      "create-breakout-rooms",
      ({ mainRoomId, config, hostId }, callback) => {
        try {
          const breakoutRooms = breakoutManager.createBreakoutRooms(
            mainRoomId,
            config,
            hostId,
          );

          io.to(mainRoomId).emit("breakout-rooms-created", {
            breakoutRooms,
            config,
          });

          callback({ success: true, breakoutRooms });
        } catch (error) {
          console.error("[Breakout] Create error:", error);
          callback({ success: false, error: error.message });
        }
      },
    );

    socket.on(
      "assign-breakout-rooms",
      ({ mainRoomId, assignments, hostId }, callback) => {
        try {
          const session = breakoutManager.getSession(mainRoomId);

          if (!session) {
            return callback({
              success: false,
              error: "Breakout session not found",
            });
          }

          if (session.hostId !== hostId) {
            return callback({
              success: false,
              error: "Only host can assign participants",
            });
          }

          breakoutManager.assignParticipants(mainRoomId, assignments);

          assignments.forEach((assignment) => {
            const targetSocket = Array.from(io.sockets.sockets.values()).find(
              (s) => s.data.userId === assignment.userId,
            );

            if (targetSocket) {
              targetSocket.emit("breakout-assignment", { assignment });
            }
          });

          callback({ success: true });
        } catch (error) {
          console.error("[Breakout] Assign error:", error);
          callback({ success: false, error: error.message });
        }
      },
    );

    socket.on(
      "open-breakout-rooms",
      ({ mainRoomId, duration, hostId }, callback) => {
        try {
          const session = breakoutManager.getSession(mainRoomId);

          if (!session) {
            return callback({
              success: false,
              error: "Breakout session not found",
            });
          }

          if (session.hostId !== hostId) {
            return callback({
              success: false,
              error: "Only host can open rooms",
            });
          }

          const breakoutRooms = breakoutManager.openBreakoutRooms(mainRoomId);

          session.assignments.forEach((breakoutRoomId, userId) => {
            const targetSocket = Array.from(io.sockets.sockets.values()).find(
              (s) => s.data.userId === userId,
            );

            if (targetSocket) {
              const room = breakoutRooms.find((r) => r.id === breakoutRoomId);

              targetSocket.emit("join-breakout-invitation", {
                breakoutRoomId,
                breakoutRoomName: room?.name || "Breakout room",
              });
            }
          });

          io.to(mainRoomId).emit("breakout-rooms-opened", { duration });

          if (duration) {
            setTimeout(
              () => {
                io.to(mainRoomId).emit("breakout-closing-soon", {
                  minutesRemaining: 5,
                });
              },
              (duration - 5) * 60 * 1000,
            );

            setTimeout(
              () => {
                io.to(mainRoomId).emit("breakout-closing-soon", {
                  minutesRemaining: 1,
                });
              },
              (duration - 1) * 60 * 1000,
            );

            setTimeout(
              () => {
                socket.emit("close-breakout-rooms", { mainRoomId, hostId });
              },
              duration * 60 * 1000,
            );
          }

          callback({ success: true });
        } catch (error) {
          console.error("[Breakout] Open error:", error);
          callback({ success: false, error: error.message });
        }
      },
    );

    socket.on("close-breakout-rooms", ({ mainRoomId, hostId }, callback) => {
      try {
        const session = breakoutManager.getSession(mainRoomId);

        if (!session) {
          return callback({
            success: false,
            error: "Breakout session not found",
          });
        }

        if (session.hostId !== hostId) {
          return callback({
            success: false,
            error: "Only host can close rooms",
          });
        }

        breakoutManager.closeBreakoutRooms(mainRoomId);

        session.breakoutRooms.forEach((room) => {
          io.to(room.id).emit("breakout-rooms-closed");
        });

        io.to(mainRoomId).emit("breakout-rooms-closed");

        callback({ success: true });
      } catch (error) {
        console.error("[Breakout] Close error:", error);
        callback({ success: false, error: error.message });
      }
    });

    socket.on(
      "join-breakout-room",
      async ({ userId, userName, mainRoomId, breakoutRoomId }, callback) => {
        try {
          const session = breakoutManager.getSession(mainRoomId);

          if (!session || !session.isOpen) {
            return callback({
              success: false,
              error: "Breakout rooms not open",
            });
          }

          socket.leave(mainRoomId);
          socket.join(breakoutRoomId);

          socket.data.currentRoom = breakoutRoomId;
          socket.data.isInBreakout = true;

          io.to(mainRoomId).emit("participant-moved-to-breakout", {
            userId,
            userName,
            breakoutRoomId,
          });

          io.to(breakoutRoomId).emit("user-joined-breakout", {
            userId,
            userName,
          });

          callback({ success: true });
        } catch (error) {
          console.error("[Breakout] Join error:", error);
          callback({ success: false, error: error.message });
        }
      },
    );

    socket.on(
      "return-to-main-room",
      ({ userId, mainRoomId, currentBreakoutId }, callback) => {
        try {
          if (currentBreakoutId) {
            socket.leave(currentBreakoutId);

            io.to(currentBreakoutId).emit("user-left-breakout", {
              userId,
              userName: socket.data.userName,
            });
          }

          socket.join(mainRoomId);

          socket.data.currentRoom = mainRoomId;
          socket.data.isInBreakout = false;

          io.to(mainRoomId).emit("participant-returned-to-main", {
            userId,
            userName: socket.data.userName,
          });

          callback({ success: true });
        } catch (error) {
          console.error("[Breakout] Return error:", error);
          callback({ success: false, error: error.message });
        }
      },
    );

    socket.on(
      "broadcast-to-breakouts",
      ({ mainRoomId, message, hostId, hostName }) => {
        try {
          const session = breakoutManager.getSession(mainRoomId);
          if (!session) return;
          if (session.hostId !== hostId) return;

          session.breakoutRooms.forEach((room) => {
            io.to(room.id).emit("host-broadcast", {
              message,
              hostName,
            });
          });
        } catch (error) {
          console.error("[Breakout] Broadcast error:", error);
        }
      },
    );

    socket.on(
      "request-help",
      ({ userId, userName, mainRoomId, breakoutRoomId, message }) => {
        try {
          const session = breakoutManager.getSession(mainRoomId);
          if (!session) return;

          const room = session.breakoutRooms.find(
            (r) => r.id === breakoutRoomId,
          );

          const hostSocket = Array.from(io.sockets.sockets.values()).find(
            (s) => s.data.userId === session.hostId,
          );

          if (hostSocket) {
            hostSocket.emit("help-request", {
              userId,
              userName,
              breakoutRoomId,
              breakoutRoomName: room?.name || "Unknown Room",
              message,
            });
          }
        } catch (error) {
          console.error("[Breakout] Help request error:", error);
        }
      },
    );

    socket.on("start-recording", async (payload = {}, callback) => {
      try {
        const socketRoomId = socket.data?.roomId;
        const payloadRoomId = payload?.roomId;
        const safeRoomId = socketRoomId || payloadRoomId;
        const userId = socket.data?.userId || socket.userId;
        const userName = socket.data?.userName || socket.user?.name || "Host";
        const isHost = Boolean(socket.data?.isHost);

        console.log("[recording:start requested]", {
          socketId: socket.id,
          socketRoomId,
          payloadRoomId,
          safeRoomId,
          userId,
          userName,
          isHost,
          roomExists: safeRoomId ? rooms.has(safeRoomId) : false,
          producerCount: safeRoomId ? getRoomProducerCount(safeRoomId) : 0,
        });

        if (!safeRoomId || !socketRoomId) {
          return callback?.({
            success: false,
            error: "Join the room before starting a recording.",
          });
        }

        const recordingBillingPolicy = await resolveRoomBillingPolicy({
          roomId: safeRoomId,
          userId,
          userName,
          isHost: true,
        });

        if (!recordingBillingPolicy.limits?.recording_enabled) {
          const denial = buildBillingDenial({
            code: "PLAN_RECORDING_DISABLED",
            message:
              "Recording is not included on the " +
              recordingBillingPolicy.plan_name +
              " plan. Upgrade to Pro or higher to record meetings.",
            policy: recordingBillingPolicy,
          });

          emitBillingDenial(socket, "start-recording", denial, callback);
          return;
        }

        const recordingUsageAccess = await canStartRecordingByUsage(
          recordingBillingPolicy,
        );

        if (!recordingUsageAccess.allowed) {
          const denial = buildBillingDenial({
            code: recordingUsageAccess.code,
            message: recordingUsageAccess.message,
            policy: recordingBillingPolicy,
          });

          denial.entitlement = recordingUsageAccess.entitlement || null;

          emitBillingDenial(socket, "start-recording", denial, callback);
          return;
        }

        if (payloadRoomId && payloadRoomId !== socketRoomId) {
          return callback?.({
            success: false,
            error:
              "Recording room mismatch. Please refresh and rejoin the room.",
          });
        }

        if (!isHost) {
          return callback?.({
            success: false,
            error: "Only the meeting host can start recording.",
          });
        }

        if (!rooms.has(safeRoomId)) {
          return callback?.({
            success: false,
            error:
              "Meeting media room is not ready yet. Wait until your camera appears, then try again.",
          });
        }

        if (getRoomProducerCount(safeRoomId) === 0) {
          return callback?.({
            success: false,
            error:
              "No audio or video is available to record yet. Wait for media to connect, then try again.",
          });
        }

        const activeRecording = get_active_browser_recording(safeRoomId);

        if (activeRecording) {
          io.to(safeRoomId).emit("recording-started", {
            recordingId: activeRecording.recordingId,
            roomId: safeRoomId,
            fileName: activeRecording.fileName,
            mimeType: "video/mp4",
            startedAt: new Date(activeRecording.startedAt).toISOString(),
            alreadyRecording: true,
          });

          return callback?.({
            success: true,
            data: {
              recordingId: activeRecording.recordingId,
              roomId: safeRoomId,
              fileName: activeRecording.fileName,
              mimeType: "video/mp4",
              startedAt: new Date(activeRecording.startedAt).toISOString(),
              alreadyRecording: true,
            },
          });
        }

        const result = await start_browser_recording_service({
          db_query: query,
          roomId: safeRoomId,
          hostUserId: socket.data?.userId || socket.userId,
          hostUserName: socket.data?.userName || socket.user?.name || "Host",
        });

        if (!result.success) {
          return callback?.({
            success: false,
            error: result.message || "Unable to start recording.",
          });
        }

        io.to(safeRoomId).emit("recording-started", {
          ...result.data,
          roomId: safeRoomId,
          startedAt: result.data?.startedAt || new Date().toISOString(),
        });

        return callback?.({
          success: true,
          data: {
            ...result.data,
            roomId: safeRoomId,
          },
        });
      } catch (error) {
        console.error("start-recording error:", error);

        return callback?.({
          success: false,
          error: error?.message || "Unable to start recording.",
        });
      }
    });

    socket.on("stop-recording", async (payload = {}, callback) => {
      try {
        const socketRoomId = socket.data?.roomId;
        const payloadRoomId = payload?.roomId;
        const safeRoomId = socketRoomId || payloadRoomId;
        const isHost = Boolean(socket.data?.isHost);

        console.log("[recording:stop requested]", {
          socketId: socket.id,
          socketRoomId,
          payloadRoomId,
          safeRoomId,
          isHost,
        });

        if (!safeRoomId || !socketRoomId) {
          return callback?.({
            success: false,
            error: "Join the room before stopping a recording.",
          });
        }

        if (payloadRoomId && payloadRoomId !== socketRoomId) {
          return callback?.({
            success: false,
            error:
              "Recording room mismatch. Please refresh and rejoin the room.",
          });
        }

        if (!isHost) {
          return callback?.({
            success: false,
            error: "Only the meeting host can stop recording.",
          });
        }

        const result = await stop_browser_recording_service({
          db_query: query,
          roomId: safeRoomId,
        });

        if (!result.success) {
          return callback?.({
            success: false,
            error: result.message || "Unable to stop recording.",
          });
        }

        io.to(safeRoomId).emit("recording-stopped", {
          ...result.data,
          roomId: safeRoomId,
        });

        return callback?.({
          success: true,
          data: {
            ...result.data,
            roomId: safeRoomId,
          },
        });
      } catch (error) {
        console.error("stop-recording error:", error);

        return callback?.({
          success: false,
          error: error?.message || "Unable to stop recording.",
        });
      }
    });
  });
};
