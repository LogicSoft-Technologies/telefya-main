import { apiRequest } from "@/lib/api/client";

export type ReportSummary = {
  total_meetings: number;
  total_attendees: number;
  total_minutes: number;
  recordings: number;
};

export type AttendanceReport = {
  id: string | number;
  meeting_title: string;
  attendee_name: string;
  attendee_email?: string | null;
  joined_at?: string | null;
  left_at?: string | null;
  duration_minutes?: number;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  status?: number;
};

export async function getReportSummary() {
  const response = await apiRequest<ApiResponse<ReportSummary>>(
    "/user/analytics/summary",
    { method: "GET" },
  );

  return {
    ...response,
    data: response.data ?? {
      total_meetings: 0,
      total_attendees: 0,
      total_minutes: 0,
      recordings: 0,
    },
  };
}

export async function listAttendanceReports() {
  const response = await apiRequest<ApiResponse<AttendanceReport[]>>(
    "/user/analytics/attendance",
    { method: "GET" },
  );

  return {
    ...response,
    data: Array.isArray(response.data) ? response.data : [],
  };
}