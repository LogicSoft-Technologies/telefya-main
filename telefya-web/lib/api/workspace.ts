import { apiRequest } from "@/lib/api/client";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  status?: number;
};

export type WorkspaceBranding = {
  id?: number;
  owner_user_id?: string;
  workspace_name: string;
  primary_color: string;
  accent_color: string;
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type BillingOverview = {
  id?: number;
  owner_user_id?: string;
  plan_name: string;
  billing_status:
    | "inactive"
    | "active"
    | "past_due"
    | "cancelled";
  seats: number;
  renews_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type MeetingMemberRole = "speaker" | "attendee";

export type MeetingMemberStatus =
  | "invited"
  | "accepted"
  | "declined"
  | "removed";

export type MeetingMember = {
  id: number;
  meeting_id: number;
  user_id: string;
  member_role: MeetingMemberRole;
  status: MeetingMemberStatus;
  invited_at?: string;
  responded_at?: string | null;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_image?: string | null;
};

export type AssignedMeeting = {
  id: number;
  room_id: string;
  meeting_url: string;
  des?: string | null;
  shedular_user_id: string;
  time_zone?: string;
  scheduled_for?: string;
  status: "upcoming" | "live" | "ended" | "cancelled";
  started_at?: string | null;
  ended_at?: string | null;
  membership_id: number;
  member_role: MeetingMemberRole;
  member_status: MeetingMemberStatus;
  invited_at?: string;
  responded_at?: string | null;
  host_name?: string | null;
};

export type SpeakerStatus = {
  meeting_id: number;
  user_id: string;
  is_ready: boolean | number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SpeakerMaterial = {
  id: number;
  meeting_id: number;
  user_id: string;
  title: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  created_at?: string;
};

export type AttendeeNetworkUser = {
  user_id: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string | null;
};

export type AttendeeCertificate = {
  id: number;
  user_id: string;
  meeting_id?: number | null;
  meeting_title?: string | null;
  certificate_code: string;
  title: string;
  file_url?: string | null;
  issued_at?: string | null;
  created_at?: string;
};

export type AdminUser = {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role?: string;
  city?: string;
  state?: string;
  country?: string;
  is_verified?: boolean;
  status?: "active" | "suspended" | "invited";
  created_at?: string;
};

export function listAdminUsers() {
  return apiRequest<ApiResponse<AdminUser[]>>(
    "/user/admin/users",
    { method: "GET" },
  );
}

export function getBranding() {
  return apiRequest<ApiResponse<WorkspaceBranding>>(
    "/user/admin/branding",
    { method: "GET" },
  );
}

export function saveBranding(
  payload: Partial<WorkspaceBranding>,
) {
  return apiRequest<ApiResponse<WorkspaceBranding>>(
    "/user/admin/branding",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function getBillingOverview() {
  return apiRequest<ApiResponse<BillingOverview>>(
    "/user/billing",
    { method: "GET" },
  );
}

/*
 * Host meeting-member management.
 */
export function listMeetingMembers(meetingId: number | string) {
  return apiRequest<
    ApiResponse<{
      meeting: AssignedMeeting;
      members: MeetingMember[];
    }>
  >(`/user/meetings/${encodeURIComponent(String(meetingId))}/members`, {
    method: "GET",
  });
}

export function inviteMeetingMember(
  meetingId: number | string,
  payload: {
    email: string;
    member_role: MeetingMemberRole;
  },
) {
  return apiRequest<ApiResponse<MeetingMember>>(
    `/user/meetings/${encodeURIComponent(String(meetingId))}/members`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function removeMeetingMember(
  meetingId: number | string,
  memberId: number | string,
) {
  return apiRequest<
    ApiResponse<{
      id: number;
      meeting_id: number;
      status: "removed";
    }>
  >(
    `/user/meetings/${encodeURIComponent(
      String(meetingId),
    )}/members/${encodeURIComponent(String(memberId))}`,
    {
      method: "DELETE",
    },
  );
}

export function respondToMeetingInvitation(
  memberId: number | string,
  status: "accepted" | "declined",
) {
  return apiRequest<
    ApiResponse<{
      id: number;
      status: "accepted" | "declined";
    }>
  >(
    `/user/meeting-invitations/${encodeURIComponent(
      String(memberId),
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

/*
 * Speaker workspace.
 */
export function listSpeakerMeetings() {
  return apiRequest<ApiResponse<AssignedMeeting[]>>(
    "/user/workspace/speaker/meetings",
    { method: "GET" },
  );
}

export function getSpeakerStatus(meetingId: number | string) {
  const search = new URLSearchParams({
    meetingId: String(meetingId),
  });

  return apiRequest<ApiResponse<SpeakerStatus>>(
    `/user/speaker/status?${search.toString()}`,
    { method: "GET" },
  );
}

export function saveSpeakerStatus(payload: {
  meeting_id: number | string;
  is_ready: boolean;
  notes?: string | null;
}) {
  return apiRequest<ApiResponse<SpeakerStatus>>(
    "/user/speaker/status",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function listSpeakerMaterials(meetingId: number | string) {
  const search = new URLSearchParams({
    meetingId: String(meetingId),
  });

  return apiRequest<ApiResponse<SpeakerMaterial[]>>(
    `/user/speaker/materials?${search.toString()}`,
    { method: "GET" },
  );
}

export function createSpeakerMaterial(payload: {
  meeting_id: number | string;
  title: string;
  file_url: string;
  file_name?: string;
  file_type?: string;
}) {
  return apiRequest<
    ApiResponse<{
      id: number;
      meeting_id: number;
    }>
  >("/user/speaker/materials", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/*
 * Attendee workspace.
 */
export function listAttendeeMeetings() {
  return apiRequest<ApiResponse<AssignedMeeting[]>>(
    "/user/workspace/attendee/meetings",
    { method: "GET" },
  );
}

export function listAttendeeNetworking() {
  return apiRequest<ApiResponse<AttendeeNetworkUser[]>>(
    "/user/attendee/networking",
    { method: "GET" },
  );
}

export function listCertificates() {
  return apiRequest<ApiResponse<AttendeeCertificate[]>>(
    "/user/attendee/certificates",
    { method: "GET" },
  );
}

export function generateCertificate(payload: {
  meeting_id: number | string;
  title?: string;
}) {
  return apiRequest<
    ApiResponse<{
      id: number;
      certificate_code: string;
    }>
  >("/user/attendee/certificates/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}