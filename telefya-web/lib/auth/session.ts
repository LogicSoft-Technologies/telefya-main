import type { AuthUser } from "@/lib/api/auth";

const USER_KEY = "telefya_user";

type SaveUserOptions = {
  notify?: boolean;
};

function normalizeUser(user: AuthUser): AuthUser {
  return {
    ...user,
    id: user.id || user.user_id || user.user,
    user_id: user.user_id || user.id || user.user,
  };
}

export function saveUser(
  user: AuthUser | null | undefined,
  options: SaveUserOptions = {},
) {
  if (typeof window === "undefined" || !user) return;

  const shouldNotify = options.notify ?? true;
  const previous = getSavedUser();

  const nextUser = normalizeUser({
    ...(previous || {}),
    ...user,
  });

  const previousRaw = localStorage.getItem(USER_KEY);
  const nextRaw = JSON.stringify(nextUser);

  localStorage.setItem(USER_KEY, nextRaw);

  if (shouldNotify && previousRaw !== nextRaw) {
    window.dispatchEvent(new Event("telefya-auth-change"));
  }
}

export function getSavedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return normalizeUser(JSON.parse(raw) as AuthUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function clearUser() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("telefya-auth-change"));
}