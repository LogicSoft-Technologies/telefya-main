import { apiClient } from "@/lib/api/client";
import type {
  ConnectTransportPayload,
  ConsumePayload,
  CreateTransportPayload,
  CreateTransportResponse,
  DisconnectResponse,
  JoinRoomPayload,
  JoinRoomResponse,
  LeaveRoomPayload,
  MuteAllPayload,
  ProducePayload,
  RaiseHandPayload,
  ResumeConsumePayload,
  ResumeConsumeResponse,
  SaveRtpCapabilitiesPayload,
  StopScreenShareConsumerPayload,
  StopScreenSharePayload,
  StopScreenShareResponse,
} from "@/types/stream";

const BASE = "/conf_meeting/socket";

export function joinRoom(payload: JoinRoomPayload, token?: string | null) {
  return apiClient<JoinRoomResponse>(`${BASE}/join`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function createTransport(
  payload: CreateTransportPayload,
  token?: string | null
) {
  return apiClient<CreateTransportResponse>(`${BASE}/create-transport`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function connectTransport(
  payload: ConnectTransportPayload,
  token?: string | null
) {
  return apiClient<void>(`${BASE}/connect-transport`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function produceMedia(payload: ProducePayload, token?: string | null) {
  return apiClient<void>(`${BASE}/transport-produce`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function consumeMedia(payload: ConsumePayload, token?: string | null) {
  return apiClient<void>(`${BASE}/consume`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function leaveRoom(payload: LeaveRoomPayload, token?: string | null) {
  return apiClient<void>(`${BASE}/leave`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function resumeConsume(
  payload: ResumeConsumePayload,
  token?: string | null
) {
  return apiClient<ResumeConsumeResponse>(`${BASE}/resume-consume`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function muteAll(payload: MuteAllPayload, token?: string | null) {
  return apiClient<void>(`${BASE}/mute-all`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function raiseHand(payload: RaiseHandPayload, token?: string | null) {
  return apiClient<void>(`${BASE}/raise-hand`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function stopMyConsumerForScreenShare(
  payload: StopScreenShareConsumerPayload,
  token?: string | null
) {
  return apiClient<{ userId: string }>(`${BASE}/stop-my-consumer-for-screen-share`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function stopScreenShare(
  payload: StopScreenSharePayload,
  token?: string | null
) {
  return apiClient<StopScreenShareResponse>(`${BASE}/stop-screen-share`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function disconnectRoom(token?: string | null) {
  return apiClient<DisconnectResponse>(`${BASE}/disconnect`, {
    method: "POST",
    token,
  });
}

export function saveRtpCapabilities(
  payload: SaveRtpCapabilitiesPayload,
  token?: string | null
) {
  return apiClient<void>(`${BASE}/save-rtp-capabilities`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}