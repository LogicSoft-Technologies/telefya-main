import type { AuthUser } from "@/lib/api/auth";

const USER_KEY = "telefya_user";

type SaveUserOptions = {
  notify?: boolean;
};

function normalizeUser(user: Partial<AuthUser>): AuthUser {
  const id = user.id || user.user_id || user.user;

  return {
    ...user,
    id,
    user_id: user.user_id || id,
  } as AuthUser;
}

function getIdentity(user?: Partial<AuthUser> | null) {
  return String(
    user?.id ||
      user?.user_id ||
      user?.user ||
      user?.email ||
      "",
  )
    .trim()
    .toLowerCase();
}

function mergeSameUser(
  previous: AuthUser | null,
  next: Partial<AuthUser>,
) {
  if (!previous) {
    return normalizeUser(next);
  }

  const previousIdentity = getIdentity(previous);
  const nextIdentity = getIdentity(next);

  // Never carry one account's data into another account.
  if (
    previousIdentity &&
    nextIdentity &&
    previousIdentity !== nextIdentity
  ) {
    return normalizeUser(next);
  }

  return normalizeUser({
    ...previous,
    ...next,
  });
}

export function saveUser(
  user: AuthUser | null | undefined,
  options: SaveUserOptions = {},
) {
  if (typeof window === "undefined" || !user) return;

  const shouldNotify = options.notify ?? true;
  const previous = getSavedUser();
  const nextUser = mergeSameUser(previous, user);

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
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid saved user.");
    }

    return normalizeUser(parsed as AuthUser);
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