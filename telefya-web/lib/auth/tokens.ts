const ACCESS_TOKEN_KEY = "telefya_access_token";
const REFRESH_TOKEN_KEY = "telefya_refresh_token";

export function saveAccessToken(token: string | null | undefined) {
  if (typeof window === "undefined" || !token) return;

  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  window.dispatchEvent(new Event("telefya-auth-change"));
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.dispatchEvent(new Event("telefya-auth-change"));
}

export function saveRefreshToken(token: string | null | undefined) {
  if (typeof window === "undefined" || !token) return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
  window.dispatchEvent(new Event("telefya-auth-change"));
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearRefreshToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  clearAccessToken();
  clearRefreshToken();
}