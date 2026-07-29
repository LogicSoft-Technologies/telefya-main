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
  return apiClient.post<JoinRoomResponse>(`${BASE}/join`, payload, {
    authToken: token,
  });
}

export function createTransport(
  payload: CreateTransportPayload,
  token?: string | null
) {
  return apiClient.post<CreateTransportResponse>(
    `${BASE}/create-transport`,
    payload,
    { authToken: token }
  );
}

export function connectTransport(
  payload: ConnectTransportPayload,
  token?: string | null
) {
  return apiClient.post<void>(`${BASE}/connect-transport`, payload, {
    authToken: token,
  });
}

export function produceMedia(payload: ProducePayload, token?: string | null) {
  return apiClient.post<void>(`${BASE}/transport-produce`, payload, {
    authToken: token,
  });
}

export function consumeMedia(payload: ConsumePayload, token?: string | null) {
  return apiClient.post<void>(`${BASE}/consume`, payload, {
    authToken: token,
  });
}

export function leaveRoom(payload: LeaveRoomPayload, token?: string | null) {
  return apiClient.post<void>(`${BASE}/leave`, payload, {
    authToken: token,
  });
}

export function resumeConsume(
  payload: ResumeConsumePayload,
  token?: string | null
) {
  return apiClient.post<ResumeConsumeResponse>(
    `${BASE}/resume-consume`,
    payload,
    { authToken: token }
  );
}

export function muteAll(payload: MuteAllPayload, token?: string | null) {
  return apiClient.post<void>(`${BASE}/mute-all`, payload, {
    authToken: token,
  });
}

export function raiseHand(payload: RaiseHandPayload, token?: string | null) {
  return apiClient.post<void>(`${BASE}/raise-hand`, payload, {
    authToken: token,
  });
}

export function stopMyConsumerForScreenShare(
  payload: StopScreenShareConsumerPayload,
  token?: string | null
) {
  return apiClient.post<{ userId: string }>(
    `${BASE}/stop-my-consumer-for-screen-share`,
    payload,
    { authToken: token }
  );
}

export function stopScreenShare(
  payload: StopScreenSharePayload,
  token?: string | null
) {
  return apiClient.post<StopScreenShareResponse>(
    `${BASE}/stop-screen-share`,
    payload,
    { authToken: token }
  );
}

export function disconnectRoom(token?: string | null) {
  return apiClient.post<DisconnectResponse>(`${BASE}/disconnect`, undefined, {
    authToken: token,
  });
}

export function saveRtpCapabilities(
  payload: SaveRtpCapabilitiesPayload,
  token?: string | null
) {
  return apiClient.post<void>(`${BASE}/save-rtp-capabilities`, payload, {
    authToken: token,
  });
}