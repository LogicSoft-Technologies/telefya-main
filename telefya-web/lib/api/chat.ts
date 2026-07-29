import { apiClient } from "@/lib/api/client";
import type {
  DeleteMessagePayload,
  DeleteMessageResponse,
  EditMessagePayload,
  EditMessageResponse,
  RoomMessage,
  SendMessagePayload,
} from "@/types/chat";

const BASE = "/conf_meeting/socket";

export function sendRoomMessage(payload: SendMessagePayload, token?: string | null) {
  return apiClient.post<RoomMessage>(`${BASE}/send-message`, payload, {
    authToken: token,
  });
}

export function editRoomMessage(payload: EditMessagePayload, token?: string | null) {
  return apiClient.post<EditMessageResponse>(`${BASE}/edit-message`, payload, {
    authToken: token,
  });
}

export function deleteRoomMessage(
  payload: DeleteMessagePayload,
  token?: string | null
) {
  return apiClient.post<DeleteMessageResponse>(`${BASE}/delete-message`, payload, {
    authToken: token,
  });
}