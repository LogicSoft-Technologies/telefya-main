import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types/auth";

export type Conference = {
  id: string;
  title: string;
  description?: string;
  status: "upcoming" | "live" | "ended";
  starts_at?: string;
  ends_at?: string;
  meeting_url?: string;
};

export type Speaker = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  status?: "invited" | "backstage" | "live";
};

export type AgendaItem = {
  id: string;
  title: string;
  speaker?: string;
  starts_at: string;
  ends_at?: string;
};

export function listConferences(token: string) {
  return apiClient<ApiResponse<Conference[]>>("/conferences", {
    method: "GET",
    token,
  });
}

export function getConference(conferenceId: string, token: string) {
  return apiClient<ApiResponse<Conference>>(`/conferences/${conferenceId}`, {
    method: "GET",
    token,
  });
}

export function listSpeakers(conferenceId: string, token: string) {
  return apiClient<ApiResponse<Speaker[]>>(
    `/conferences/${conferenceId}/speakers`,
    {
      method: "GET",
      token,
    }
  );
}

export function listAgenda(conferenceId: string, token: string) {
  return apiClient<ApiResponse<AgendaItem[]>>(
    `/conferences/${conferenceId}/agenda`,
    {
      method: "GET",
      token,
    }
  );
}