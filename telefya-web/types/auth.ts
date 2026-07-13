export type ApiResponse<T = undefined> = {
  success: boolean;
  message: string;
  status: number;
  error?: string;
  data?: T;
};

export type AuthUser = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  country?: string;
  state?: string;
  city?: string;
  date_of_birth?: string;
  country_code?: string;
};

export type RegisterPayload = {
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
};

export type RegisterResponse = ApiResponse<{
  user: Pick<AuthUser, "id" | "email">;
}>;

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = ApiResponse<{
  accessToken: string;
  user: Pick<AuthUser, "id" | "email">;
}>;

export type VerifyEmailPayload = {
  email: string;
  otp: string;
};

export type ResendOtpPayload = {
  email: string;
};

export type RequestPasswordResetPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  email: string;
  token: string;
  password: string;
};

export type RefreshTokenResponse = {
  success: boolean;
  message: string;
  accessToken: string;
  status: number;
};

export type LogoutResponse = ApiResponse;