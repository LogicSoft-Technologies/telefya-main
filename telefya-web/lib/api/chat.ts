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
  return apiClient<RoomMessage>(`${BASE}/send-message`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function editRoomMessage(payload: EditMessagePayload, token?: string | null) {
  return apiClient<EditMessageResponse>(`${BASE}/edit-message`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteRoomMessage(
  payload: DeleteMessagePayload,
  token?: string | null
) {
  return apiClient<DeleteMessageResponse>(`${BASE}/delete-message`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}