import { apiRequest } from "@/lib/api/client";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  status?: number;
};

export type AdminUser = {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone_number?: string;
  role?: string;
  country?: string;
  state?: string;
  city?: string;
  is_verified?: boolean | number;
  created_at?: string;
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
  billing_status: "inactive" | "active" | "past_due" | "cancelled";
  seats: number;
  renews_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SpeakerStatus = {
  user_id: string;
  is_ready: boolean | number;
  approval_status: "pending" | "approved" | "rejected";
  notes?: string | null;
};

export type SpeakerMaterial = {
  id: number;
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
  email: string;
  country?: string;
  state?: string;
  city?: string;
};

export type AttendeeCertificate = {
  id: number;
  user_id: string;
  meeting_id?: number | null;
  certificate_code: string;
  title: string;
  file_url?: string | null;
  issued_at?: string | null;
  created_at?: string;
};

export function listAdminUsers() {
  return apiRequest<ApiResponse<AdminUser[]>>("/user/admin/users", {
    method: "GET",
  });
}

export function getBranding() {
  return apiRequest<ApiResponse<WorkspaceBranding>>("/user/admin/branding", {
    method: "GET",
  });
}

export function saveBranding(payload: Partial<WorkspaceBranding>) {
  return apiRequest<ApiResponse<WorkspaceBranding>>("/user/admin/branding", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getBillingOverview() {
  return apiRequest<ApiResponse<BillingOverview>>("/user/billing", {
    method: "GET",
  });
}

export function getSpeakerStatus() {
  return apiRequest<ApiResponse<SpeakerStatus>>("/user/speaker/status", {
    method: "GET",
  });
}

export function saveSpeakerStatus(payload: Partial<SpeakerStatus>) {
  return apiRequest<ApiResponse<SpeakerStatus>>("/user/speaker/status", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listSpeakerMaterials() {
  return apiRequest<ApiResponse<SpeakerMaterial[]>>("/user/speaker/materials", {
    method: "GET",
  });
}

export function createSpeakerMaterial(payload: Partial<SpeakerMaterial>) {
  return apiRequest<ApiResponse<{ id: number }>>("/user/speaker/materials", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listAttendeeNetworking() {
  return apiRequest<ApiResponse<AttendeeNetworkUser[]>>(
    "/user/attendee/networking",
    {
      method: "GET",
    }
  );
}

export function listCertificates() {
  return apiRequest<ApiResponse<AttendeeCertificate[]>>(
    "/user/attendee/certificates",
    {
      method: "GET",
    }
  );
}

export function generateCertificate(payload: {
  meeting_id?: number | string | null;
  title?: string;
}) {
  return apiRequest<ApiResponse<{ id: number; certificate_code: string }>>(
    "/user/attendee/certificates/generate",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}