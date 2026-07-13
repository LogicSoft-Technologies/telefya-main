"use client";

import { getAccessToken } from "@/lib/auth/tokens";
import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let socketKey = "";

type MeetingSocketOptions = {
  recorderBot?: boolean;
  recorderSecret?: string;
};

export function getMeetingSocket(options: MeetingSocketOptions = {}) {
  const token = getAccessToken();
  const url =
    process.env.NEXT_PUBLIC_SOCKET_URL || "https://meet.bornwithwealth.com";
  const namespace = process.env.NEXT_PUBLIC_SOCKET_NAMESPACE || "/conf_meeting";

  const nextKey = `${url}${namespace}:${options.recorderBot ? "recorder" : "user"}`;

  if (socket && socketKey === nextKey) {
    socket.auth = {
      token,
      accessToken: token,
      recorderSecret: options.recorderSecret,
    };

    socket.io.opts.query = {
      token,
      recorderBot: options.recorderBot ? "true" : "false",
      recorderSecret: options.recorderSecret || "",
    };

    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socketKey = nextKey;

  socket = io(`${url}${namespace}`, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    auth: {
      token,
      accessToken: token,
      recorderSecret: options.recorderSecret,
    },
    query: {
      token,
      recorderBot: options.recorderBot ? "true" : "false",
      recorderSecret: options.recorderSecret || "",
    },
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 800,
  });

  return socket;
}

export function closeMeetingSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  socketKey = "";
}