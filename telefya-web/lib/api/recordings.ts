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
  data: T;
  status?: number;
};

const API_DOWNLOAD_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api/backend";

export function listRecordings() {
  return apiRequest<ApiResponse<MeetingRecording[]>>("/user/recordings", {
    method: "GET",
  });
}

export async function getRecording(recordingId: string) {
  const response = await listRecordings();
  const recording = response.data.find(
    (item) =>
      String(item.recording_id) === recordingId || String(item.id) === recordingId
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
    {
      method: "DELETE",
    }
  );
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
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message = "Unable to download recording.";

    try {
      const payload = await response.json();
      message = payload?.message || message;
    } catch {
      // File download endpoint may not return JSON.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition");
  const match = disposition?.match(/filename="?([^"]+)"?/i);

  return {
    blob,
    fileName: match?.[1] || `telefya-recording-${recordingId}.mp4`,
  };
}

export async function saveRecordingToDevice(recordingId: string) {
  const { blob, fileName } = await downloadRecording(recordingId);
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}