"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  CalendarPlus,
  Home,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";
import { logout } from "@/lib/api/auth";
import { clearUser, getSavedUser } from "@/lib/auth/session";
import {
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
} from "@/lib/auth/tokens";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { AuthUser } from "@/lib/api/auth";

type TopbarUser = Partial<AuthUser> & {
  role?: string;
  roles?: string;
  image?: string | null;
  profile_image?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
};

function getFullName(user: TopbarUser | null | undefined) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
}

function getDisplayName(user: TopbarUser | null | undefined) {
  return getFullName(user) || user?.email || "Signed in user";
}

function getProfileImage(user: TopbarUser | null | undefined) {
  return (
    user?.profile_image ||
    user?.avatar_url ||
    user?.avatar ||
    user?.image ||
    ""
  );
}

function getAssetUrl(value?: string | null) {
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "http://localhost:5000";

  const cleanPath = value
    .replace(/^\.\/public\//, "/")
    .replace(/^public\//, "/")
    .replace(/\\/g, "/");

  return `${backendUrl}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
}

function mergeDefinedUsers(...users: (TopbarUser | null | undefined)[]) {
  const merged: TopbarUser = {};

  for (const user of users) {
    if (!user) continue;

    for (const [key, value] of Object.entries(user)) {
      if (value !== undefined && value !== null && value !== "") {
        (merged as any)[key] = value;
      }
    }
  }

  return Object.keys(merged).length ? merged : null;
}

function toggleMobileNav() {
  window.dispatchEvent(new Event("telefya-toggle-nav"));
}

export function PlatformTopbar({ user }: { user: AuthUser | null }) {
  const router = useRouter();
  const { profile, loading } = useCurrentUser();

  const savedUser = getSavedUser() as TopbarUser | null;
  const currentUser = mergeDefinedUsers(user, savedUser, profile);
  const displayName = getDisplayName(currentUser);
  const role = currentUser?.role || currentUser?.roles || "User";
  const profileImageUrl = getAssetUrl(getProfileImage(currentUser));

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      const token = getAccessToken();
      if (token) await logout(token);
    } catch {
    } finally {
      clearAccessToken();
      clearRefreshToken();
      clearUser();
      window.dispatchEvent(new Event("telefya-auth-change"));
      router.replace("/login");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-xl">
      <style jsx global>{`
        @keyframes telefyaMenuIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-6px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .telefya-menu-in {
          animation: telefyaMenuIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .telefya-menu-in {
            animation: none !important;
          }
        }
      `}</style>

      <div className="flex h-[60px] items-center justify-between gap-2 px-3 sm:h-[68px] sm:gap-4 sm:px-5 lg:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={toggleMobileNav}
            aria-label="Open menu"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border text-navy-600 transition-all duration-200 active:scale-90 hover:border-telefya-blue hover:text-telefya-blue lg:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <p className="hidden text-[10px] font-black uppercase tracking-[0.16em] text-navy-300 sm:block">
              Telefya workspace
            </p>
            <h1 className="mt-0.5 truncate text-sm font-black text-navy-900 sm:text-base">
              Welcome back, {loading && !currentUser ? "..." : displayName}
            </h1>
          </div>
        </div>

        <div className="hidden h-10 min-w-[300px] items-center gap-3 rounded-xl border border-border bg-navy-50 px-4 transition-all duration-200 focus-within:border-telefya-blue focus-within:bg-white focus-within:shadow-soft md:flex">
          <Search size={16} className="shrink-0 text-navy-400" />
          <input
            placeholder="Search meetings, speakers, attendees..."
            className="w-full bg-transparent text-sm font-semibold text-navy-700 outline-none placeholder:text-navy-300"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/"
            className="hidden h-10 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-black text-navy-700 transition-all duration-200 hover:border-telefya-blue hover:text-telefya-blue md:inline-flex"
          >
            <Home size={16} />
            Home
          </Link>

          <Link
            href="/meetings/create"
            className="hidden h-10 items-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-black text-white shadow-soft transition-all duration-200 hover:bg-telefya-violet hover:shadow-enterprise sm:inline-flex"
          >
            <CalendarPlus size={16} />
            Create
          </Link>

          <Link
            href="/lobby"
            className="hidden h-10 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-black text-navy-700 transition-all duration-200 hover:border-telefya-violet hover:text-telefya-violet sm:inline-flex"
          >
            <Video size={16} />
            Join
          </Link>

          <button
            onClick={() => setMobileSearchOpen((value) => !value)}
            aria-label="Search"
            className={[
              "grid h-10 w-10 place-items-center rounded-xl border text-navy-500 transition-all duration-200 active:scale-90 hover:border-telefya-blue hover:text-telefya-blue md:hidden",
              mobileSearchOpen
                ? "border-telefya-blue bg-blue-50 text-telefya-blue"
                : "border-border",
            ].join(" ")}
          >
            {mobileSearchOpen ? <X size={17} /> : <Search size={17} />}
          </button>

          <div className="relative sm:hidden">
            <button
              onClick={() => {
                setProfileMenuOpen(false);
                setQuickMenuOpen((value) => !value);
              }}
              aria-label="New meeting"
              className="grid h-10 w-10 place-items-center rounded-xl bg-telefya-blue text-white shadow-soft transition-all duration-200 active:scale-90 hover:bg-telefya-violet"
            >
              <Plus size={18} />
            </button>

            {quickMenuOpen ? (
              <>
                <div
                  onClick={() => setQuickMenuOpen(false)}
                  aria-hidden="true"
                  className="fixed inset-0 z-40"
                />

                <div className="telefya-menu-in absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-border bg-white p-1.5 shadow-enterprise">
                  <Link
                    href="/meetings/create"
                    onClick={() => setQuickMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-navy-700 transition hover:bg-navy-50"
                  >
                    <CalendarPlus size={16} className="text-telefya-blue" />
                    Start meeting
                  </Link>

                  <Link
                    href="/lobby"
                    onClick={() => setQuickMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-navy-700 transition hover:bg-navy-50"
                  >
                    <Video size={16} className="text-telefya-violet" />
                    Join meeting
                  </Link>

                  <Link
                    href="/"
                    onClick={() => setQuickMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-navy-700 transition hover:bg-navy-50"
                  >
                    <Home size={16} className="text-navy-400" />
                    Go home
                  </Link>
                </div>
              </>
            ) : null}
          </div>

          <button
            aria-label="Notifications"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border text-navy-500 transition-all duration-200 active:scale-90 hover:border-telefya-blue hover:text-telefya-blue"
          >
            <Bell size={17} />
          </button>

          <span className="mx-1 hidden h-5 w-px bg-border md:block" />

          <div className="hidden items-center gap-3 md:flex">
            <div className="telefya-gradient grid h-10 w-10 overflow-hidden rounded-xl text-sm font-black text-white shadow-soft ring-2 ring-transparent transition-all duration-200 hover:ring-telefya-blue/25">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center">
                  {initials || "U"}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="max-w-[170px] truncate text-sm font-black text-navy-900">
                {displayName}
              </p>
              <p className="flex items-center gap-1 text-[11px] font-bold text-navy-400">
                <ShieldCheck size={12} className="text-telefya-green" />
                {role}
              </p>
            </div>
          </div>

          <div className="relative md:hidden">
            <button
              onClick={() => {
                setQuickMenuOpen(false);
                setProfileMenuOpen((value) => !value);
              }}
              aria-label="Account"
              className="telefya-gradient grid h-10 w-10 shrink-0 overflow-hidden rounded-xl text-sm font-black text-white shadow-soft ring-2 ring-transparent transition-all duration-200 active:scale-90 hover:ring-telefya-blue/25"
            >
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center">
                  {initials || "U"}
                </span>
              )}
            </button>

            {profileMenuOpen ? (
              <>
                <div
                  onClick={() => setProfileMenuOpen(false)}
                  aria-hidden="true"
                  className="fixed inset-0 z-40"
                />

                <div className="telefya-menu-in absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-border bg-white p-1.5 shadow-enterprise">
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-black text-navy-900">
                      {displayName}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-bold text-navy-400">
                      <ShieldCheck size={12} className="text-telefya-green" />
                      {role}
                    </p>
                  </div>

                  <span className="my-1 block h-px bg-border" />

                  <Link
                    href="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-navy-700 transition hover:bg-navy-50"
                  >
                    <Settings size={16} className="text-navy-400" />
                    Settings
                  </Link>

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              </>
            ) : null}
          </div>

          <button
            onClick={handleLogout}
            className="hidden h-10 w-10 place-items-center rounded-xl border border-border text-navy-500 transition-all duration-200 active:scale-90 hover:border-red-200 hover:bg-red-50 hover:text-red-600 md:grid"
            title="Log out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>

      {mobileSearchOpen ? (
        <div className="telefya-menu-in border-t border-border bg-white px-3 py-2.5 md:hidden">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-telefya-blue bg-blue-50/40 px-3">
            <Search size={16} className="shrink-0 text-navy-400" />
            <input
              autoFocus
              placeholder="Search meetings, speakers, attendees..."
              className="w-full bg-transparent text-sm font-semibold text-navy-700 outline-none placeholder:text-navy-300"
            />
            <button
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Close search"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-navy-400 transition active:scale-90 hover:bg-navy-100"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}