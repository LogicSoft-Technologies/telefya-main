import { apiRequest } from "@/lib/api/client";

export type ScheduledMeeting = {
  id: number | string;
  meeting_url: string;
  shedular_user_id: string;
  time_zone: string;
  des?: string;
  created_at?: string;
  updated_at?: string;
};

type MeetingsResponse = {
  success: boolean;
  message: string;
  data?: ScheduledMeeting[];
};

export async function getMeetings() {
  const response = await apiRequest<MeetingsResponse>("/user/get-meeting", {
    method: "GET",
  });

  return Array.isArray(response.data) ? response.data : [];
}

export async function scheduleMeeting(payload: {
  date: string;
  timeZone: string;
  path: string;
  des?: string;
}) {
  return apiRequest<{
    success: boolean;
    message: string;
    data: {
      meeting_url: string;
      time_zone: string;
      shedular_user_id?: string;
      des?: string;
    };
  }>("/user/schedule-meeting", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteMeetings(meetingIds: Array<string | number>) {
  return apiRequest<{
    success: boolean;
    message: string;
  }>("/user/delete-meeting", {
    method: "POST",
    body: JSON.stringify({ meetingIds }),
  });
}