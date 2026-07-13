import { apiRequest } from "@/lib/api/client";

export type ReportSummary = {
  total_meetings: number;
  total_attendees: number;
  total_minutes: number;
  recordings: number;
};

export type AttendanceReport = {
  id: string;
  meeting_title: string;
  attendee_name: string;
  attendee_email?: string;
  joined_at?: string;
  left_at?: string;
  duration_minutes?: number;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  status?: number;
};

export function getReportSummary() {
  return apiRequest<ApiResponse<ReportSummary>>("/user/analytics/summary", {
    method: "GET",
  });
}

export function listAttendanceReports() {
  return apiRequest<ApiResponse<AttendanceReport[]>>(
    "/user/analytics/attendance",
    {
      method: "GET",
    }
  );
}