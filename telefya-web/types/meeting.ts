import type { ApiResponse } from "@/types/auth";

export type ScheduleMeetingPayload = {
  date: string;
  timeZone: string;
  meeting_url: string;
};

export type ScheduledMeeting = {
  id: number;
  meeting_url: string;
  scheduler_user_id: string;
  time_zone: string;
  created_at: string;
  updated_at: string;
};

export type ScheduleMeetingResponse = ApiResponse<{
  meeting_url: string;
  time_zone: string;
}>;

export type GetMeetingsResponse = ApiResponse<ScheduledMeeting[]>;

export type DeleteMeetingsPayload = {
  meetingIds: string[];
};