import { apiRequest } from "@/lib/api/client";

export type RecordingStatus =
  | "recording"
  | "processing"
  | "ready"
  | "failed"
  | "expired"
  | "deleted";

export type MeetingRecording = {
  id: string | number;
  recording_id: string;
  room_id: string;
  meeting_id?: string | number | null;
  host_user_id?: string | null;
  title?: string;
  status: RecordingStatus;
  file_name?: string | null;
  file_path?: string | null;
  mime_type?: string | null;
  size_bytes?: number;
  duration_seconds?: number;
  started_at?: string | null;
  stopped_at?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  status?: number;
};

const API_DOWNLOAD_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api/backend";

export async function listRecordings() {
  const response = await apiRequest<ApiResponse<MeetingRecording[]>>(
    "/user/recordings",
    { method: "GET" },
  );

  return {
    ...response,
    data: Array.isArray(response.data) ? response.data : [],
  };
}

export async function getRecording(recordingId: string) {
  const response = await listRecordings();

  const recording = response.data.find(
    (item) =>
      String(item.recording_id) === String(recordingId) ||
      String(item.id) === String(recordingId),
  );

  if (!recording) {
    throw new Error("Recording not found.");
  }

  return {
    success: true,
    message: "Recording retrieved successfully.",
    data: recording,
  } satisfies ApiResponse<MeetingRecording>;
}

export function deleteRecording(recordingId: string) {
  return apiRequest<ApiResponse<null>>(
    `/user/recordings/${encodeURIComponent(recordingId)}`,
    { method: "DELETE" },
  );
}

function getDownloadFileName(
  contentDisposition: string | null,
  fallback: string,
) {
  if (!contentDisposition) return fallback;

  const utf8Match = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i,
  );

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const fileNameMatch = contentDisposition.match(
    /filename="?([^";]+)"?/i,
  );

  return fileNameMatch?.[1]?.trim() || fallback;
}

export async function downloadRecording(recordingId: string) {
  const token =
    typeof window === "undefined"
      ? ""
      : localStorage.getItem("telefya_access_token") || "";

  const response = await fetch(
    `${API_DOWNLOAD_BASE}/user/recordings/${encodeURIComponent(recordingId)}`,
    {
      method: "GET",
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : undefined,
    },
  );

  if (!response.ok) {
    let message = "Unable to download recording.";

    try {
      const payload = await response.json();
      message = payload?.message || message;
    } catch {
      // A file endpoint may return no JSON error body.
    }

    throw new Error(message);
  }

  const blob = await response.blob();

  return {
    blob,
    fileName: getDownloadFileName(
      response.headers.get("content-disposition"),
      `telefya-recording-${recordingId}.mp4`,
    ),
  };
}

export async function saveRecordingToDevice(recordingId: string) {
  const { blob, fileName } = await downloadRecording(recordingId);
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}