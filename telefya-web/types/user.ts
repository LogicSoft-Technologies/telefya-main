import type { ApiResponse } from "@/types/auth";

export type UserProfile = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  state: string;
  city: string;
  date_of_birth: string;
  profile_image: string | null;
  is_verified: 0 | 1;
};

export type UserProfileResponse = ApiResponse<UserProfile>;

export type UploadProfileImageResponse = {
  success: boolean;
  error?: boolean | string;
  message: string;
  image: string;
  status: number;
};