"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Mail,
  Mic2,
  MonitorUp,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
  Video,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getSavedUser } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/api/auth";

type SidebarUser = Partial<AuthUser> & {
  role?: string;
  roles?: string;
  image?: string | null;
  profile_image?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
};

const navItems = [
  { label: "Lobby", href: "/lobby", icon: CalendarDays },
  { label: "Live Stage", href: "/live/demo", match: "/live", icon: Video },
  { label: "Speaker", href: "/speaker", icon: Mic2 },
  { label: "Host Console", href: "/host", icon: MonitorUp },
  { label: "Attendee", href: "/attendee", icon: Users },
  { label: "Admin", href: "/admin", icon: ShieldCheck, adminOnly: true },
];

const secondaryItems = [
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

function getFullName(user: SidebarUser | null | undefined) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
}

function getDisplayName(user: SidebarUser | null | undefined, loading: boolean) {
  return (
    getFullName(user) ||
    user?.email ||
    (loading ? "Loading profile..." : "Signed in user")
  );
}

function getProfileImage(user: SidebarUser | null | undefined) {
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

function mergeDefinedUsers(...users: (SidebarUser | null | undefined)[]) {
  const merged: SidebarUser = {};

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

function getUserRole(user: SidebarUser | null | undefined) {
  return String(user?.role || user?.roles || "User");
}

export function PlatformSidebar() {
  const pathname = usePathname();
  const { profile, loading } = useCurrentUser();
  const savedUser = getSavedUser() as SidebarUser | null;

  const currentUser = mergeDefinedUsers(savedUser, profile);
  const displayName = getDisplayName(currentUser, loading);
  const role = getUserRole(currentUser);
  const profileImageUrl = getAssetUrl(getProfileImage(currentUser));

  const isAdmin = ["Admin", "SuperAdmin", "admin", "superadmin"].includes(role);

  const visibleNavItems = navItems.filter((item) => {
    if (item.adminOnly) return isAdmin;
    return true;
  });

  return (
    <aside className="hidden h-screen w-[278px] shrink-0 border-r border-border bg-white lg:fixed lg:left-0 lg:top-0 lg:block">
      <div className="flex h-full flex-col">
        <div className="flex h-[68px] items-center border-b border-border px-5">
          <Link href="/lobby" className="inline-flex">
            <Image
              src="/images/telefya-logo.png"
              alt="Telefya"
              width={138}
              height={42}
              priority
              className="h-9 w-auto"
            />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-navy-300">
            Workspace
          </p>

          <nav className="grid gap-1">
            {visibleNavItems.map((item) => {
              const active =
                pathname === item.href ||
                Boolean(item.match && pathname.startsWith(item.match)) ||
                (item.href !== "/lobby" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200",
                    active
                      ? "bg-[linear-gradient(135deg,rgba(15,107,255,0.12),rgba(100,38,255,0.1))] font-black text-telefya-blue"
                      : "font-bold text-navy-500 hover:translate-x-0.5 hover:bg-navy-50 hover:text-navy-900",
                  ].join(" ")}
                >
                  <item.icon
                    size={17}
                    className={active ? "text-telefya-violet" : "text-navy-400"}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <p className="mb-2 mt-7 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-navy-300">
            Operations
          </p>

          <nav className="grid gap-1">
            {secondaryItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200",
                    active
                      ? "bg-navy-50 font-black text-telefya-violet"
                      : "font-bold text-navy-500 hover:translate-x-0.5 hover:bg-navy-50 hover:text-navy-900",
                  ].join(" ")}
                >
                  <item.icon
                    size={17}
                    className={active ? "text-telefya-violet" : "text-navy-400"}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-border p-3">
          <div className="overflow-hidden rounded-xl bg-navy-900 shadow-soft transition-shadow duration-200 hover:shadow-enterprise">
            <div className="telefya-accent-line h-1" />

            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/10 text-white">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <UserCircle size={22} />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">
                    {displayName}
                  </p>

                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-bold text-white/55">
                    <Mail size={12} />
                    {currentUser?.email || role}
                  </p>
                </div>
              </div>

              <div className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/70">
                {role}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}