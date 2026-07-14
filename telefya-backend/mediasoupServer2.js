const { createWorker } = require("mediasoup");
const { config } = require("./config/mediaSoupConfig");
const { AdvancedPortManager } = require("./ports");
const { BrowserRecorder } = require("./browserRecorder");
const path = require("path");
const fs = require("fs");

let browserRecorder;
let worker;
let io;
let pubClient;
let subClient;

const rooms = new Map();

function setIo(socketIo) {
  io = socketIo;
}

function setPubSub(pub, sub) {
  pubClient = pub;
  subClient = sub;
  config.portManager = new AdvancedPortManager();
}

async function setupMediasoup(pub, sub) {
  pubClient = pub;
  subClient = sub;

  try {
    if (pubClient && !pubClient.isOpen) await pubClient.connect();
    if (subClient && !subClient.isOpen) await subClient.connect();
  } catch (err) {
    console.error("[mediasoup] Redis connection failed:", err.message);
    process.exit(1);
  }

  if (!worker) {
    worker = await createWorker(config.mediasoup.worker);

    worker.on("died", () => {
      console.error("[mediasoup] Worker died. Exiting process.");
      process.exit(1);
    });
  }

  if (!browserRecorder) {
    browserRecorder = new BrowserRecorder();
  }
}

async function saveRoomToRedis(roomId) {
  try {
    if (!pubClient || !pubClient.isOpen) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const peersObj = {};

    for (const [userId, peer] of room.peers) {
      peersObj[userId] = {
        userId,
        userName: peer.userName,
        isHost: peer.isHost,
        rtpCapabilities: peer.rtpCapabilities || null,
      };
    }

    await pubClient.hSet(`room:${roomId}`, {
      routerId: room.router.id,
      peers: JSON.stringify(peersObj),
      screenSharingUser: room.screenSharingUser || "",
      updatedAt: String(Date.now()),
    });

    await pubClient.sAdd("rooms", roomId);
  } catch (err) {
    console.error(`[mediasoup] Failed to save room ${roomId}:`, err.message);
  }
}

async function deleteRoomFromRedis(roomId) {
  try {
    if (!pubClient || !pubClient.isOpen) return;

    await pubClient.del(`room:${roomId}`);
    await pubClient.sRem("rooms", roomId);
  } catch (err) {
    console.error(`[mediasoup] Failed to delete room ${roomId}:`, err.message);
  }
}

function getTransportOptions() {
  const transportConfig = config.mediasoup.webRtcTransport || {};
  const {
    maxIncomingBitrate,
    maxOutgoingBitrate,
    rtcMinPort,
    rtcMaxPort,
    ...transportOptions
  } = transportConfig;

  return {
    transportOptions,
    maxIncomingBitrate,
  };
}

function closeMapItems(map) {
  if (!map) return;

  for (const [, item] of map) {
    try {
      if (!item.closed) item.close();
    } catch {}
  }

  map.clear();
}

function closePeerMedia(peer) {
  if (!peer) return;

  closeMapItems(peer.consumers);
  closeMapItems(peer.producers);
  closeMapItems(peer.transports);
}

function serializeProducer(producer, peer) {
  return {
    producerId: producer.id,
    kind: producer.kind,
    isScreen: Boolean(producer.appData?.isScreen),
    userId: producer.appData?.userId || peer?.userId,
    userName: producer.appData?.userName || peer?.userName,
    appData: producer.appData || {},
  };
}

function getSerializableProducers(room) {
  const producers = [];

  if (!room) return producers;

  for (const [, peer] of room.peers) {
    for (const producer of peer.producers.values()) {
      producers.push({
        ...serializeProducer(producer, peer),
        screenSharingUser: room.screenSharingUser || null,
      });
    }
  }

  return producers;
}

function getExistingProducers(room) {
  const producers = new Map();

  if (!room) return producers;

  for (const [, peer] of room.peers) {
    for (const producer of peer.producers.values()) {
      producers.set(producer.id, {
        ...serializeProducer(producer, peer),
        producer,
      });
    }
  }

  return producers;
}

async function createRoom(roomId) {
  if (!roomId) throw new Error("roomId is required");

  if (!worker) {
    throw new Error("mediasoup worker is not initialized");
  }

  if (rooms.has(roomId)) {
    return rooms.get(roomId);
  }

  const router = await worker.createRouter(config.mediasoup.router);

  const room = {
    router,
    peers: new Map(),
    screenSharingUser: undefined,
    createdAt: Date.now(),
  };

  rooms.set(roomId, room);
  await saveRoomToRedis(roomId);

  return room;
}

async function joinRoom(socket, roomId, userId, userName = "", isHost = false) {
  if (!roomId) throw new Error("roomId is required");
  if (!userId) throw new Error("userId is required");

  const room = await createRoom(roomId);

  const hasHost = Array.from(room.peers.values()).some((peer) => peer.isHost);
  const shouldBeHost = Boolean(isHost || !hasHost);

  const existingPeer = room.peers.get(userId);
  if (existingPeer) {
    closePeerMedia(existingPeer);
  }

  const peer = {
    transports: new Map(),
    producers: new Map(),
    consumers: new Map(),
    userName,
    userId,
    isHost: shouldBeHost,
    rtpCapabilities: null,
    joinedAt: Date.now(),
  };

  room.peers.set(userId, peer);

  socket.data.roomId = roomId;
  socket.data.userId = userId;
  socket.data.userName = userName;
  socket.data.isHost = shouldBeHost;

  await saveRoomToRedis(roomId);

  return {
    rtpCapabilities: room.router.rtpCapabilities,
    isHost: shouldBeHost,
    existingProducers: getSerializableProducers(room).filter(
      (producer) => producer.userId !== userId
    ),
  };
}

async function getRTCCapacity(roomId) {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");

  return room.router.rtpCapabilities;
}

async function createTransport(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");

  const peer = room.peers.get(userId);
  if (!peer) throw new Error("Peer not found");

  const { transportOptions, maxIncomingBitrate } = getTransportOptions();

  const transport = await room.router.createWebRtcTransport(transportOptions);

  if (maxIncomingBitrate) {
    try {
      await transport.setMaxIncomingBitrate(maxIncomingBitrate);
    } catch (err) {
      console.warn("[mediasoup] Could not set max incoming bitrate:", err.message);
    }
  }

  peer.transports.set(transport.id, transport);

  transport.on("dtlsstatechange", (dtlsState) => {
    if (dtlsState === "closed") {
      try {
        transport.close();
      } catch {}
    }
  });

  transport.on("close", () => {
    peer.transports.delete(transport.id);
    saveRoomToRedis(roomId);
  });

  await saveRoomToRedis(roomId);

  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
    sctpParameters: transport.sctpParameters,
  };
}

async function connectTransport(roomId, userId, transportId, dtlsParameters) {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");

  const peer = room.peers.get(userId);
  if (!peer) throw new Error("Peer not found");

  const transport = peer.transports.get(transportId);
  if (!transport) throw new Error("Transport not found");

  if (transport.dtlsState === "connected" || transport.dtlsState === "connecting") {
    return;
  }

  await transport.connect({ dtlsParameters });
}

function findPeerByTransport(room, transportId) {
  for (const [userId, peer] of room.peers) {
    if (peer.transports.has(transportId)) {
      return { userId, peer };
    }
  }

  return { userId: null, peer: null };
}

async function produce(roomId, transportId, kind, rtpParameters, appData = {}) {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");

  let userId = appData.userId;
  let peer = userId ? room.peers.get(userId) : null;

  if (!peer) {
    const found = findPeerByTransport(room, transportId);
    userId = found.userId;
    peer = found.peer;
  }

  if (!peer || !userId) throw new Error("Peer not found for producer");

  const transport = peer.transports.get(transportId);
  if (!transport) throw new Error("Send transport not found");

  const normalizedAppData = {
    ...appData,
    userId,
    userName: appData.userName || peer.userName,
    isScreen: Boolean(appData.isScreen),
  };

  const producer = await transport.produce({
    kind,
    rtpParameters,
    appData: normalizedAppData,
  });

  peer.producers.set(producer.id, producer);

  if (normalizedAppData.isScreen) {
    room.screenSharingUser = userId;
  }

  await saveRoomToRedis(roomId);

  producer.on("transportclose", () => {
    peer.producers.delete(producer.id);

    if (normalizedAppData.isScreen && room.screenSharingUser === userId) {
      room.screenSharingUser = undefined;
    }

    saveRoomToRedis(roomId);
  });

  producer.on("close", () => {
    peer.producers.delete(producer.id);

    if (normalizedAppData.isScreen && room.screenSharingUser === userId) {
      room.screenSharingUser = undefined;
    }

    saveRoomToRedis(roomId);
  });

  return producer.id;
}

async function consume(
  roomId,
  userId,
  transportId,
  producerId,
  rtpCapabilities,
  appData = {}
) {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");

  const peer = room.peers.get(userId);
  if (!peer) throw new Error("Peer not found");

  const transport = peer.transports.get(transportId);
  if (!transport) throw new Error("Transport not found");

  const producerData = getExistingProducers(room).get(producerId);
  if (!producerData || !producerData.producer) {
    throw new Error("Producer not found");
  }

  const producer = producerData.producer;

  if (producer.appData?.userId === userId) {
    return null;
  }

  if (!room.router.canConsume({ producerId: producer.id, rtpCapabilities })) {
    throw new Error("Cannot consume with given rtpCapabilities");
  }

  const consumer = await transport.consume({
    producerId: producer.id,
    rtpCapabilities,
    paused: true,
    appData: {
      producerId: producer.id,
      producerUserId: producer.appData?.userId,
      producerUserName: producer.appData?.userName,
      isScreen: Boolean(producer.appData?.isScreen),
      requestedAppData: appData || {},
    },
  });

  peer.consumers.set(consumer.id, consumer);

  consumer.on("transportclose", () => {
    peer.consumers.delete(consumer.id);
    saveRoomToRedis(roomId);
  });

  consumer.on("producerclose", () => {
    peer.consumers.delete(consumer.id);
    saveRoomToRedis(roomId);

    if (io) {
      io.to(roomId).emit("producer-closed", {
        producerId: producer.id,
        consumerId: consumer.id,
        userId: producer.appData?.userId,
        isScreen: Boolean(producer.appData?.isScreen),
      });
    }
  });

  consumer.on("trackended", () => {
    peer.consumers.delete(consumer.id);
    saveRoomToRedis(roomId);
  });

  await saveRoomToRedis(roomId);

  return {
    id: consumer.id,
    producerId: producer.id,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
    isScreen: Boolean(producer.appData?.isScreen),
    userId: producer.appData?.userId,
    userName: producer.appData?.userName,
    appData: {
      isScreen: Boolean(producer.appData?.isScreen),
      userId: producer.appData?.userId,
      userName: producer.appData?.userName,
      producerId: producer.id,
    },
  };
}

async function resumeConsumer(roomId, userId, consumerId) {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");

  const peer = room.peers.get(userId);
  if (!peer) throw new Error("Peer not found");

  const consumer = peer.consumers.get(consumerId);
  if (!consumer) throw new Error("Consumer not found");

  if (!consumer.closed) {
    await consumer.resume();
  }

  await saveRoomToRedis(roomId);
}

async function stopScreenShare(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const peer = room.peers.get(userId);
  if (!peer) return;

  for (const [id, producer] of peer.producers) {
    if (producer.appData?.isScreen) {
      try {
        producer.close();
      } catch {}

      peer.producers.delete(id);
    }
  }

  if (room.screenSharingUser === userId) {
    room.screenSharingUser = undefined;
  }

  await saveRoomToRedis(roomId);
}

async function stopConsumerScreenSharing(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const peer = room.peers.get(userId);
  if (!peer) return;

  for (const [id, consumer] of peer.consumers) {
    if (consumer.appData?.isScreen) {
      try {
        consumer.close();
      } catch {}

      peer.consumers.delete(id);
    }
  }

  await saveRoomToRedis(roomId);
}

function cleanupPeer(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const peer = room.peers.get(userId);
  if (!peer) return;

  closePeerMedia(peer);
  room.peers.delete(userId);

  if (room.screenSharingUser === userId) {
    room.screenSharingUser = undefined;
  }

  if (room.peers.size === 0) {
    try {
      room.router.close();
    } catch {}

    rooms.delete(roomId);
    deleteRoomFromRedis(roomId);
    return;
  }

  saveRoomToRedis(roomId);
}

async function leaveRoom(roomId, userId) {
  if (!roomId || !userId) return true;

  cleanupPeer(roomId, userId);
  return true;
}

async function savePeerRtpCapabilities(roomId, userId, rtpCapabilities) {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found");

  const peer = room.peers.get(userId);
  if (!peer) throw new Error("Peer not found");

  peer.rtpCapabilities = rtpCapabilities;
  await saveRoomToRedis(roomId);
}

async function startRecording(socket, { roomId, userId, userName, meetingUrl }) {
  if (!browserRecorder) {
    browserRecorder = new BrowserRecorder();
  }

  if (!roomId) throw new Error("roomId is required");
  if (!meetingUrl) throw new Error("meetingUrl is required");

  if (browserRecorder.isRecording(roomId)) {
    throw new Error("Recording already in progress for this room");
  }

  const result = await browserRecorder.startRecording({
    roomId,
    userId: userId || socket.data?.userId || "unknown",
    userName: userName || socket.data?.userName || "Unknown User",
    meetingUrl,
  });

  socket.data.recordingId = result.recordingId;

  if (pubClient && pubClient.isOpen) {
    await pubClient.publish(
      `room:${roomId}:recording-started`,
      JSON.stringify({
        roomId,
        recordingId: result.recordingId,
        fileName: result.fileName,
        userId,
        userName,
        startTime: result.startTime,
        timestamp: Date.now(),
      })
    );
  }

  return result;
}

async function stopRecording(socket, { roomId, recordingId } = {}) {
  if (!browserRecorder) {
    browserRecorder = new BrowserRecorder();
  }

  const targetRoomId = roomId || socket.data?.roomId;

  if (!targetRoomId) {
    throw new Error("roomId is required");
  }

  if (!browserRecorder.isRecording(targetRoomId)) {
    throw new Error("No active recording found for this room");
  }

  const result = await browserRecorder.stopRecording(targetRoomId);

  if (socket.data) {
    delete socket.data.recordingId;
  }

  if (pubClient && pubClient.isOpen) {
    await pubClient.publish(
      `room:${targetRoomId}:recording-stopped`,
      JSON.stringify({
        roomId: targetRoomId,
        recordingId: recordingId || result.recordingId || targetRoomId,
        fileName: result.fileName,
        fileSize: result.fileSize,
        duration: result.duration,
        success: result.success,
        timestamp: Date.now(),
      })
    );
  }

  return result;
}

async function getRecording(recordingId) {
  try {
    if (!browserRecorder) {
      browserRecorder = new BrowserRecorder();
    }

    if (browserRecorder.isRecording(recordingId)) {
      return await browserRecorder.getRecordingStatus(recordingId);
    }

    const recordingsDir = path.resolve("./recordings_meeting");

    if (!fs.existsSync(recordingsDir)) {
      return null;
    }

    const files = fs.readdirSync(recordingsDir);
    const recordingFile = files.find((file) => file.includes(recordingId));

    if (!recordingFile) {
      return null;
    }

    const filePath = path.join(recordingsDir, recordingFile);
    const stats = fs.statSync(filePath);

    return {
      roomId: recordingId,
      recordingId,
      fileName: recordingFile,
      filePath,
      fileSize: stats.size,
      isActive: false,
    };
  } catch (error) {
    console.error("[recording] Failed to get recording:", error.message);
    return null;
  }
}

function getRouter(roomId) {
  const room = rooms.get(roomId);

  if (!room?.router) {
    throw new Error("Room router not found");
  }

  return room.router;
}

function getRoomProducerInfos(roomId) {
  const room = rooms.get(roomId);
  const producerInfos = [];

  if (!room) return producerInfos;

  for (const [, peer] of room.peers) {
    for (const producer of peer.producers.values()) {
      producerInfos.push({
        producer,
        socketId: null,
        kind: producer.kind,
        userData: {
          userId: producer.appData?.userId || peer.userId,
          userName: producer.appData?.userName || peer.userName,
          isScreen: Boolean(producer.appData?.isScreen),
          appData: producer.appData || {},
        },
      });
    }
  }

  return producerInfos;
}

async function createRecordingPlainTransport(roomId) {
  const router = getRouter(roomId);

  return router.createPlainTransport({
    listenIp: {
      ip: "127.0.0.1",
      announcedIp: undefined,
    },
    rtcpMux: true,
    comedia: false,
  });
}

const mediaSoupService = {
  getRouter,
  getRoomProducerInfos,
  createRecordingPlainTransport,
};

module.exports = {
  setupMediasoup,
  setIo,
  setPubSub,
  createRoom,
  joinRoom,
  createTransport,
  connectTransport,
  produce,
  consume,
  stopScreenShare,
  leaveRoom,
  savePeerRtpCapabilities,
  getExistingProducers,
  getRTCCapacity,
  resumeConsumer,
  stopConsumerScreenSharing,
  startRecording,
  stopRecording,
  getRecording,
  mediaSoupService,
  rooms,
};