"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile } from "@/lib/api/users";
import { clearUser, getSavedUser, saveUser } from "@/lib/auth/session";
import { clearAccessToken, getAccessToken } from "@/lib/auth/tokens";
import type { AuthUser } from "@/lib/api/auth";

function isAuthError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const status = typeof error === "object" && error && "status" in error
    ? Number((error as { status?: number }).status)
    : 0;

  return (
    status === 401 ||
    status === 403 ||
    message.includes("unauthorized") ||
    message.includes("expired") ||
    message.includes("invalid token") ||
    message.includes("access denied")
  );
}

export function useAuthGuard() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const token = getAccessToken();

      if (!token) {
        clearUser();
        if (mounted) setChecking(false);
        router.replace("/login");
        return;
      }

      const savedUser = getSavedUser();

      if (mounted && savedUser) {
        setUser(savedUser);
      }

      try {
        const profile = await getUserProfile(token);

        if (!mounted) return;

        const mergedUser = {
          ...(savedUser || {}),
          ...profile,
        };

        saveUser(mergedUser);
        setUser(mergedUser);
      } catch (error) {
        if (isAuthError(error)) {
          clearAccessToken();
          clearUser();

          if (mounted) {
            setUser(null);
            setChecking(false);
          }

          router.replace("/login");
          return;
        }

        if (!savedUser && mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    checkSession();

    function handleAuthChange() {
      if (!mounted) return;
      setUser(getSavedUser());
    }

    window.addEventListener("telefya-auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      mounted = false;
      window.removeEventListener("telefya-auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [router]);

  return {
    user,
    checking,
  };
}