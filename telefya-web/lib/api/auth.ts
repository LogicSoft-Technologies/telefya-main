import { apiRequest } from "@/lib/api/client";

export type AuthUser = {
  id?: string;
  user?: string;
  user_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  country?: string;
  state?: string;
  city?: string;
  date_of_birth?: string;
  country_code?: string;
  role?: string;
  roles?: string;
  is_verified?: boolean | number;
  profile_image?: string | null;
};

type ApiEnvelope<T> = {
  success?: boolean;
  error?: boolean;
  message?: string;
  data?: T;
  status?: number;
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  token?: string;
  user?: AuthUser;
  profile?: AuthUser;
};

type LoginResponseData = {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  token?: string;
  user?: AuthUser;
  profile?: AuthUser;
  data?: {
    accessToken?: string;
    access_token?: string;
    refreshToken?: string;
    refresh_token?: string;
    token?: string;
    user?: AuthUser;
    profile?: AuthUser;
  };
} & Partial<AuthUser>;

function looksLikeUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;

  const body = value as AuthUser;

  return Boolean(
    body.email ||
      body.first_name ||
      body.last_name ||
      body.user_id ||
      body.id ||
      body.user,
  );
}

function normalizeUser(user: AuthUser | null | undefined): AuthUser | null {
  if (!user) return null;

  return {
    ...user,
    id: user.id || user.user_id || user.user,
    user_id: user.user_id || user.id || user.user,
  };
}

function getAccessTokenFromResponse(response: ApiEnvelope<LoginResponseData>) {
  return (
    response.data?.accessToken ||
    response.data?.access_token ||
    response.data?.token ||
    response.data?.data?.accessToken ||
    response.data?.data?.access_token ||
    response.data?.data?.token ||
    response.accessToken ||
    response.access_token ||
    response.token ||
    null
  );
}

function getRefreshTokenFromResponse(response: ApiEnvelope<LoginResponseData>) {
  return (
    response.data?.refreshToken ||
    response.data?.refresh_token ||
    response.data?.data?.refreshToken ||
    response.data?.data?.refresh_token ||
    response.refreshToken ||
    response.refresh_token ||
    null
  );
}

function getUserFromResponse(response: ApiEnvelope<LoginResponseData>) {
  const candidates = [
    response.data?.user,
    response.data?.profile,
    response.data?.data?.user,
    response.data?.data?.profile,
    response.user,
    response.profile,
    response.data,
  ];

  const user = candidates.find(looksLikeUser) || null;

  return normalizeUser(user);
}

export async function loginUser(payload: {
  email: string;
  password: string;
}) {
  const response = await apiRequest<ApiEnvelope<LoginResponseData>>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        email: payload.email.trim().toLowerCase(),
      }),
    },
  );

  const accessToken = getAccessTokenFromResponse(response);
  const refreshToken = getRefreshTokenFromResponse(response);
  const user = getUserFromResponse(response);

  if (!accessToken) {
    throw new Error(
      response.message || "Login failed. No access token was returned.",
    );
  }

  return {
    accessToken,
    refreshToken,
    user,
    message: response.message ?? "Login successful",
  };
}

export const login = loginUser;

export async function registerUser(payload: {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  country: string;
  state: string;
  city: string;
  date_of_birth: string;
  country_code: string;
}) {
  return apiRequest<ApiEnvelope<{ user: AuthUser } | AuthUser>>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        email: payload.email.trim().toLowerCase(),
      }),
    },
  );
}

export async function verifyEmail(payload: { email: string; otp: string }) {
  return apiRequest<ApiEnvelope<null>>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
      otp: payload.otp.trim(),
    }),
  });
}

export async function resendOtp(payload: { email: string }) {
  return apiRequest<ApiEnvelope<null>>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
    }),
  });
}

export async function requestPasswordReset(payload: { email: string }) {
  return apiRequest<ApiEnvelope<null>>("/auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
    }),
  });
}

export async function resetPassword(payload: {
  email: string;
  token: string;
  password: string;
}) {
  return apiRequest<ApiEnvelope<null>>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      email: payload.email.trim().toLowerCase(),
    }),
  });
}

export async function logout(token?: string | null) {
  return apiRequest<{
    success: boolean;
    message: string;
    status: number;
  }>("/user/logout", {
    method: "POST",
    authToken: token,
  });
}