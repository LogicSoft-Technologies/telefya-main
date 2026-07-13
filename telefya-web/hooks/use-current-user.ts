"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUserProfile } from "@/lib/api/users";
import { getSavedUser, saveUser } from "@/lib/auth/session";
import { getAccessToken } from "@/lib/auth/tokens";
import type { AuthUser } from "@/lib/api/auth";

export type CurrentUserProfile = AuthUser & {
  profile_image?: string | null;
};

function normalizeUser(user: Partial<AuthUser> | null | undefined) {
  if (!user) return null;

  return {
    ...user,
    id: user.id || user.user_id || user.user,
    user_id: user.user_id || user.id || user.user,
  } as CurrentUserProfile;
}

function hasIdentity(user: Partial<AuthUser> | null | undefined) {
  return Boolean(user?.first_name || user?.last_name || user?.email);
}

export function useCurrentUser() {
  const loadingRef = useRef(false);

  const [profile, setProfile] = useState<CurrentUserProfile | null>(() =>
    normalizeUser(getSavedUser()),
  );
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()));
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (loadingRef.current) return;

    const token = getAccessToken();
    const savedUser = normalizeUser(getSavedUser());

    if (hasIdentity(savedUser)) {
      setProfile(savedUser);
    }

    if (!token) {
      setLoading(false);
      setError(savedUser ? "" : "No active session.");
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const user = await getUserProfile(token);
      const normalizedUser = normalizeUser(user);

      if (!hasIdentity(normalizedUser)) {
        throw new Error("Profile response did not include user details.");
      }

      setProfile(normalizedUser);

      // Important: silent save prevents auth-change -> loadProfile loops.
      saveUser(normalizedUser, { notify: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load profile.");

      if (savedUser) {
        setProfile(savedUser);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();

    function handleAuthChange() {
      const savedUser = normalizeUser(getSavedUser());

      if (savedUser) {
        setProfile(savedUser);
      }

      loadProfile();
    }

    window.addEventListener("telefya-auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("telefya-auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    reload: loadProfile,
  };
}