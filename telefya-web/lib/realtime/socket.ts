"use client";

import { io, type Socket } from "socket.io-client";

import { getAccessToken } from "@/lib/auth/tokens";

let socket: Socket | null = null;
let socketKey = "";

export type MeetingSocketOptions = {
  recorderBot?: boolean;
  recorderSecret?: string;
};

function getSocketOrigin() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://api.telefya.com";

  try {

    return new URL(configuredUrl).origin;
  } catch {
    return "https://api.telefya.com";
  }
}

function getSocketNamespace() {
  const namespace = process.env.NEXT_PUBLIC_SOCKET_NAMESPACE || "/conf_meeting";

  return namespace.startsWith("/") ? namespace : `/${namespace}`;
}

function createSocketKey(
  origin: string,
  namespace: string,
  token: string | null,
  options: MeetingSocketOptions,
) {
  return [
    origin,
    namespace,
    options.recorderBot ? "recorder" : "user",
    token || "anonymous",
    options.recorderSecret || "",
  ].join("|");
}

function buildSocketAuth(token: string | null, options: MeetingSocketOptions) {
  return {
    token: token || "",
    accessToken: token || "",
    recorderSecret: options.recorderSecret || "",
  };
}

function buildSocketQuery(token: string | null, options: MeetingSocketOptions) {
  return {
    token: token || "",
    recorderBot: options.recorderBot ? "true" : "false",
    recorderSecret: options.recorderSecret || "",
  };
}

export function getMeetingSocket(options: MeetingSocketOptions = {}) {
  const token = getAccessToken();
  const origin = getSocketOrigin();
  const namespace = getSocketNamespace();

  const nextKey = createSocketKey(origin, namespace, token, options);

  if (socket && socketKey === nextKey) {
    socket.auth = buildSocketAuth(token, options);

    socket.io.opts.query = buildSocketQuery(token, options);

    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socketKey = nextKey;

  socket = io(`${origin}${namespace}`, {
    autoConnect: false,

    // Your backend accepts both. WebSocket is attempted first for
    // meeting media signalling, with polling as a safe fallback.
    transports: ["websocket", "polling"],

    auth: buildSocketAuth(token, options),
    query: buildSocketQuery(token, options),

    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 700,
    reconnectionDelayMax: 5_000,
    randomizationFactor: 0.4,
    timeout: 12_000,
  });

  return socket;
}

export function refreshMeetingSocketAuth(options: MeetingSocketOptions = {}) {
  const activeSocket = getMeetingSocket(options);

  if (activeSocket.connected) {
    activeSocket.disconnect();
    activeSocket.connect();
  }

  return activeSocket;
}

export function closeMeetingSocket() {
  if (!socket) return;

  socket.removeAllListeners();
  socket.disconnect();

  socket = null;
  socketKey = "";
}
