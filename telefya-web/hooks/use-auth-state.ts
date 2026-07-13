"use client";

import { useEffect, useState } from "react";
import { getSavedUser } from "@/lib/auth/session";
import { getAccessToken } from "@/lib/auth/tokens";
import type { AuthUser } from "@/types/auth";

export function useAuthState() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  function syncAuthState() {
    const token = getAccessToken();
    const savedUser = getSavedUser();

    setUser(savedUser);
    setAuthenticated(Boolean(token && savedUser));
    setReady(true);
  }

  useEffect(() => {
    syncAuthState();

    function handleStorage() {
      syncAuthState();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("telefya-auth-change", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("telefya-auth-change", handleStorage);
    };
  }, []);

  return {
    ready,
    user,
    authenticated,
    refresh: syncAuthState,
  };
}