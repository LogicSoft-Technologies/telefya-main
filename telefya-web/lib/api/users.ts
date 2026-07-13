import { apiRequest } from "@/lib/api/client";
import type { AuthUser } from "@/lib/api/auth";

export type UserProfileUpdatePayload = {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  country_code?: string;
  country?: string;
  state?: string;
  city?: string;
  date_of_birth?: string;
};

type ProfileResponse =
  | AuthUser
  | AuthUser[]
  | {
      success?: boolean;
      error?: boolean;
      message?: string;
      status?: number;
      image?: string;
      data?:
        | AuthUser
        | AuthUser[]
        | {
            user?: AuthUser;
            profile?: AuthUser;
          };
      user?: AuthUser;
      profile?: AuthUser;
    };

function unwrapUser(payload: ProfileResponse): AuthUser {
  const body = payload as any;

  const user =
    body?.data?.user ||
    body?.data?.profile ||
    body?.user ||
    body?.profile ||
    body?.data ||
    body;

  if (Array.isArray(user)) {
    return user[0] || {};
  }

  return user || {};
}

export async function getUserProfile(token?: string | null) {
  const response = await apiRequest<ProfileResponse>("/user/profile", {
    method: "GET",
    authToken: token,
  });

  return unwrapUser(response);
}

export async function updateUserProfile(payload: UserProfileUpdatePayload) {
  const response = await apiRequest<ProfileResponse>("/user/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return unwrapUser(response);
}

export async function uploadProfileImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  return apiRequest<ProfileResponse>("/user/upload-file", {
    method: "POST",
    body: formData,
  });
}