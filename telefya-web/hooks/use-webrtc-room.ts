"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { closeMeetingSocket, getMeetingSocket } from "@/lib/realtime/socket";
import type { LiveChatMessage, RoomUser, RoomUsersPayload } from "@/types/live";

type RemoteStream = {
  socketId: string;
  user?: RoomUser;
  stream: MediaStream;
};

const iceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
];

export function useWebrtcRoom(params: {
  roomId: string;
  userId: string;
  userName: string;
}) {
  const { roomId, userId, userName } = params;

  const socketRef = useRef<ReturnType<typeof getMeetingSocket> | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const [connected, setConnected] = useState(false);
  const [currentSocketId, setCurrentSocketId] = useState("");
  const [isPresenter, setIsPresenter] = useState(false);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const createPeer = useCallback(
    (peerSocketId: string, peerUser?: RoomUser) => {
      const existing = peersRef.current.get(peerSocketId);
      if (existing) return existing;

      const socket = socketRef.current;
      const peer = new RTCPeerConnection({ iceServers });

      localStreamRef.current?.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current as MediaStream);
      });

      peer.onicecandidate = (event) => {
        if (!event.candidate || !socket) return;

        socket.emit("signal", {
          receiverId: peerSocketId,
          senderId: socket.id,
          roomId,
          signal: event.candidate,
          isScreen: false,
          isPresenter,
        });
      };

      peer.ontrack = (event) => {
        const [stream] = event.streams;

        setRemoteStreams((current) => {
          const exists = current.some((item) => item.socketId === peerSocketId);
          if (exists) {
            return current.map((item) =>
              item.socketId === peerSocketId ? { ...item, stream, user: peerUser } : item
            );
          }

          return [...current, { socketId: peerSocketId, stream, user: peerUser }];
        });
      };

      peer.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(peer.connectionState)) {
          peersRef.current.delete(peerSocketId);
          setRemoteStreams((current) =>
            current.filter((item) => item.socketId !== peerSocketId)
          );
        }
      };

      peersRef.current.set(peerSocketId, peer);
      return peer;
    },
    [roomId, isPresenter]
  );

  const callPeer = useCallback(
    async (peerSocketId: string, peerUser?: RoomUser) => {
      const socket = socketRef.current;
      if (!socket || peerSocketId === socket.id) return;

      const peer = createPeer(peerSocketId, peerUser);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("signal", {
        receiverId: peerSocketId,
        senderId: socket.id,
        roomId,
        signal: offer,
        isScreen: false,
        isPresenter,
      });
    },
    [createPeer, roomId]
  );

  useEffect(() => {
    let mounted = true;

    async function start() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (!mounted) return;

      localStreamRef.current = stream;
      setLocalStream(stream);

      const socket = getMeetingSocket();
      socketRef.current = socket;

      socket.on("connect", () => {
        setConnected(true);
        setCurrentSocketId(socket.id || "");

        socket.emit("join-room", {
          roomId,
          userId,
          userName,
        });
      });

      socket.on("disconnect", () => {
        setConnected(false);
      });

      socket.on("room-users", async (payload: RoomUsersPayload) => {
        setRoomUsers(payload.roomUsers);
        setCurrentSocketId(payload.currentUserId);
        setIsPresenter(payload.isPresenter);

        const otherUsers = payload.roomUsers.filter(
          (user) => user.id !== payload.currentUserId
        );

        for (const user of otherUsers) {
          await callPeer(user.id, user);
        }
      });

      socket.on("signal", async ({ senderId, signal, user }) => {
        const peer = createPeer(senderId, user);

        if ("type" in signal && signal.type === "offer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          socket.emit("signal", {
            receiverId: senderId,
            senderId: socket.id,
            roomId,
            signal: answer,
            isScreen: false,
            isPresenter,
          });

          return;
        }

        if ("type" in signal && signal.type === "answer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
          return;
        }

        await peer.addIceCandidate(new RTCIceCandidate(signal));
      });

      socket.on("response-send-message", (message: LiveChatMessage) => {
        setMessages((current) => [...current, message]);
      });

      socket.on("toggle-mic-update", ({ userId: socketId, status }) => {
        setRoomUsers((current) =>
          current.map((user) =>
            user.id === socketId ? { ...user, micStatus: status } : user
          )
        );
      });

      socket.on("toggle-video-update", ({ userId: socketId, status }) => {
        setRoomUsers((current) =>
          current.map((user) =>
            user.id === socketId ? { ...user, videoStatus: status } : user
          )
        );
      });

      socket.on("user-disconnected", (user: RoomUser) => {
        peersRef.current.get(user.id)?.close();
        peersRef.current.delete(user.id);

        setRoomUsers((current) => current.filter((item) => item.id !== user.id));
        setRemoteStreams((current) =>
          current.filter((item) => item.socketId !== user.id)
        );
      });

      socket.connect();
    }

    start();

    return () => {
      mounted = false;

      socketRef.current?.emit("user-leave", {
        userSocketId: socketRef.current.id,
        roomId,
      });

      peersRef.current.forEach((peer) => peer.close());
      peersRef.current.clear();

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      closeMeetingSocket();
    };
  }, [roomId, userId, userName, callPeer, createPeer]);

  function toggleMic() {
    const next = !micEnabled;
    setMicEnabled(next);

    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });

    socketRef.current?.emit("toggle-mic", {
      userId: socketRef.current.id,
      status: next,
      roomId,
      isPresenter,
      condition: "self",
    });
  }

  function toggleCamera() {
    const next = !cameraEnabled;
    setCameraEnabled(next);

    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });

    socketRef.current?.emit("toggle-video", {
      userId: socketRef.current.id,
      status: next,
      roomId,
      isPresenter,
      condition: "self",
    });
  }

  function sendMessage(message: string) {
    const clean = message.trim();
    if (!clean) return;

    socketRef.current?.emit("send-message", {
      roomId,
      message: clean,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      userName,
      userId: socketRef.current.id,
      messageId: crypto.randomUUID(),
    });
  }

  return {
    connected,
    currentSocketId,
    isPresenter,
    roomUsers,
    localStream,
    remoteStreams,
    messages,
    micEnabled,
    cameraEnabled,
    toggleMic,
    toggleCamera,
    sendMessage,
  };
}