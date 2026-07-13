"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  CalendarPlus,
  ChevronDown,
  Grid3X3,
  GraduationCap,
  Headphones,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MonitorUp,
  Phone,
  PlaySquare,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { logout as logoutRequest } from "@/lib/api/auth";
import { clearUser, getSavedUser } from "@/lib/auth/session";
import {
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
} from "@/lib/auth/tokens";
import type { AuthUser } from "@/lib/api/auth";

type NavUser = Partial<AuthUser> & {
  role?: string;
  roles?: string;
  image?: string | null;
  profile_image?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
};

const productItems = [
  {
    title: "Meetings",
    desc: "HD meetings for teams and clients.",
    icon: Video,
    href: "/lobby",
  },
  {
    title: "Chat",
    desc: "Messaging for events and workspaces.",
    icon: MessageSquare,
    href: "/lobby",
  },
  {
    title: "Phone",
    desc: "Voice workflows for organizations.",
    icon: Phone,
    href: "/contact-sales",
  },
  {
    title: "Scheduler",
    desc: "Plan rooms and upcoming sessions.",
    icon: CalendarPlus,
    href: "/meetings/create",
  },
  {
    title: "Live Stage",
    desc: "Host webinars, panels, and events.",
    icon: MonitorUp,
    href: "/live/test-room-1",
  },
  {
    title: "Analytics",
    desc: "Track participation and performance.",
    icon: BarChart3,
    href: "/analytics",
  },
];

const solutionItems = [
  { title: "Healthcare", icon: HeartPulse, href: "#solutions" },
  { title: "Education", icon: GraduationCap, href: "#solutions" },
  { title: "Enterprise", icon: Building2, href: "#solutions" },
  { title: "Government", icon: Landmark, href: "#solutions" },
  { title: "Retail & E-commerce", icon: ShoppingCart, href: "#solutions" },
  { title: "Communities", icon: Users, href: "#solutions" },
];

const resourceItems = [
  {
    title: "Security",
    desc: "Encryption, access, and controls.",
    icon: ShieldCheck,
    href: "#resources",
  },
  {
    title: "API Docs",
    desc: "Build with Telefya services.",
    icon: PlaySquare,
    href: "#resources",
  },
  {
    title: "Support",
    desc: "Talk to product support.",
    icon: Headphones,
    href: "#resources",
  },
];

type MenuKey = "product" | "solutions" | "resources" | "apps";

function getFullName(user: NavUser | null | undefined) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
}

function getDisplayName(user: NavUser | null | undefined) {
  return getFullName(user) || user?.email || "Telefya user";
}

function getProfileImage(user: NavUser | null | undefined) {
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

function useMarketingAuth() {
  const [state, setState] = useState<{
    authed: boolean;
    user: NavUser | null;
    name: string;
  }>({
    authed: false,
    user: null,
    name: "Telefya user",
  });

  useEffect(() => {
    function sync() {
      const savedUser = getSavedUser() as NavUser | null;

      setState({
        authed: Boolean(getAccessToken()),
        user: savedUser,
        name: getDisplayName(savedUser),
      });
    }

    sync();

    window.addEventListener("telefya-auth-change", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);

    return () => {
      window.removeEventListener("telefya-auth-change", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return state;
}

export function MarketingNavbar() {
  const { authed, user, name } = useMarketingAuth();
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const profileImageUrl = getAssetUrl(getProfileImage(user));

  function toggle(key: MenuKey) {
    setOpenMenu((prev) => (prev === key ? null : key));
  }

  useEffect(() => {
    function onOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", onOutside);

    return () => {
      document.removeEventListener("mousedown", onOutside);
    };
  }, []);

  async function handleLogout() {
    try {
      const token = getAccessToken();
      if (token) await logoutRequest(token);
    } catch {
    } finally {
      clearAccessToken();
      clearRefreshToken();
      clearUser();
      window.dispatchEvent(new Event("telefya-auth-change"));
      setOpenMenu(null);
    }
  }

  function navButtonClass(key: MenuKey) {
    return [
      "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition",
      openMenu === key
        ? "bg-blue-50 text-telefya-blue"
        : "text-navy-600 hover:bg-navy-50 hover:text-navy-900",
    ].join(" ");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-xl">
      <nav
        ref={navRef}
        className="relative mx-auto flex h-[68px] max-w-[96rem] items-center justify-between gap-6 px-5 lg:px-8"
      >
        <Link href="/" className="shrink-0">
          <Image
            src="/images/telefya-logo.png"
            alt="Telefya"
            width={154}
            height={46}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <button
            onClick={() => toggle("product")}
            className={navButtonClass("product")}
          >
            Product
            <ChevronDown
              size={14}
              className={
                openMenu === "product"
                  ? "rotate-180 transition-transform"
                  : "transition-transform"
              }
            />
          </button>

          <button
            onClick={() => toggle("solutions")}
            className={navButtonClass("solutions")}
          >
            Solutions
            <ChevronDown
              size={14}
              className={
                openMenu === "solutions"
                  ? "rotate-180 transition-transform"
                  : "transition-transform"
              }
            />
          </button>

          <Link
            href="#pricing"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-navy-600 hover:bg-navy-50 hover:text-navy-900"
          >
            Pricing
          </Link>

          <button
            onClick={() => toggle("resources")}
            className={navButtonClass("resources")}
          >
            Resources
            <ChevronDown
              size={14}
              className={
                openMenu === "resources"
                  ? "rotate-180 transition-transform"
                  : "transition-transform"
              }
            />
          </button>

          <Link
            href="#company"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-navy-600 hover:bg-navy-50 hover:text-navy-900"
          >
            Company
          </Link>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <button className="grid h-10 w-10 place-items-center rounded-xl text-navy-500 hover:bg-navy-50 hover:text-telefya-blue">
            <Search size={17} />
          </button>

          <Link
            href="/contact-sales"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50"
          >
            Contact Sales
          </Link>

          {authed ? (
            <>
              <Link
                href="/lobby"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-telefya-blue px-4 text-sm font-semibold text-white shadow-soft hover:bg-telefya-violet"
              >
                <LayoutDashboard size={16} />
                Workspace
              </Link>

              <div className="hidden items-center gap-2 rounded-xl border border-border bg-white px-2 py-1 shadow-soft xl:flex">
                <div className="telefya-gradient grid h-8 w-8 overflow-hidden rounded-lg text-xs font-semibold text-white">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center">
                      {initials || "U"}
                    </span>
                  )}
                </div>

                <span className="max-w-[130px] truncate text-sm font-semibold text-navy-900">
                  {name}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="grid h-10 w-10 place-items-center rounded-xl border border-border text-navy-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50 hover:text-navy-900"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-telefya-blue px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-telefya-violet"
              >
                Start free
              </Link>
            </>
          )}

          <button
            onClick={() => toggle("apps")}
            className={[
              "grid h-10 w-10 place-items-center rounded-xl transition",
              openMenu === "apps"
                ? "bg-telefya-blue text-white"
                : "bg-navy-50 text-navy-700 hover:bg-navy-100",
            ].join(" ")}
          >
            <Grid3X3 size={16} />
          </button>
        </div>

        <Link
          href={authed ? "/lobby" : "/login"}
          className="rounded-xl bg-telefya-blue px-4 py-2 text-sm font-semibold text-white shadow-soft lg:hidden"
        >
          {authed ? "Workspace" : "Sign in"}
        </Link>

        {openMenu === "product" ? (
          <div className="absolute left-1/2 top-full hidden w-[680px] -translate-x-1/2 overflow-hidden rounded-b-xl border border-t-0 border-border bg-white shadow-enterprise lg:block">
            <div className="telefya-accent-line h-1" />
            <div className="grid grid-cols-2">
              {productItems.map((item, index) => (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => setOpenMenu(null)}
                  className={[
                    "flex gap-4 p-5 hover:bg-navy-50",
                    index % 2 === 0 ? "border-r border-border" : "",
                    index < productItems.length - 2
                      ? "border-b border-border"
                      : "",
                  ].join(" ")}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-telefya-blue">
                    <item.icon size={18} />
                  </span>
                  <span>
                    <strong className="block text-sm font-semibold text-navy-900">
                      {item.title}
                    </strong>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-navy-500">
                      {item.desc}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {openMenu === "solutions" ? (
          <div className="absolute left-1/2 top-full hidden w-[760px] -translate-x-1/2 overflow-hidden rounded-b-xl border border-t-0 border-border bg-white shadow-enterprise lg:block">
            <div className="telefya-accent-line h-1" />
            <div className="grid grid-cols-3">
              {solutionItems.map((item, index) => (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => setOpenMenu(null)}
                  className={[
                    "flex items-center gap-3 p-5 hover:bg-navy-50",
                    index % 3 !== 2 ? "border-r border-border" : "",
                    index < 3 ? "border-b border-border" : "",
                  ].join(" ")}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-telefya-blue">
                    <item.icon size={18} />
                  </span>
                  <span className="text-sm font-semibold text-navy-900">
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {openMenu === "resources" ? (
          <div className="absolute left-1/2 top-full hidden w-[520px] -translate-x-1/2 overflow-hidden rounded-b-xl border border-t-0 border-border bg-white shadow-enterprise lg:block">
            <div className="telefya-accent-line h-1" />
            {resourceItems.map((item, index) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => setOpenMenu(null)}
                className={[
                  "flex gap-4 p-5 hover:bg-navy-50",
                  index < resourceItems.length - 1
                    ? "border-b border-border"
                    : "",
                ].join(" ")}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-telefya-blue">
                  <item.icon size={18} />
                </span>
                <span>
                  <strong className="block text-sm font-semibold text-navy-900">
                    {item.title}
                  </strong>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-navy-500">
                    {item.desc}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        {openMenu === "apps" ? (
          <div className="absolute right-0 top-full hidden w-[370px] overflow-hidden rounded-b-xl border border-t-0 border-border bg-white shadow-enterprise lg:block">
            <div className="bg-navy-900">
              <div className="telefya-accent-line h-1" />
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    Telefya Workplace
                  </h3>
                  <Link
                    href={authed ? "/lobby" : "/register"}
                    onClick={() => setOpenMenu(null)}
                    className="text-xs font-semibold text-telefya-green"
                  >
                    View all -&gt;
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3">
              {(
                [
                  ["Meetings", Video, "/lobby"],
                  ["Chat", MessageSquare, "/lobby"],
                  ["Live Stage", MonitorUp, "/live/test-room-1"],
                  ["Scheduler", CalendarPlus, "/meetings/create"],
                  ["Dashboard", LayoutDashboard, "/lobby"],
                  ["AI Companion", Sparkles, "/lobby"],
                ] as const
              ).map(([label, Icon, href], index) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpenMenu(null)}
                  className={[
                    "flex flex-col items-center gap-2 py-5 text-xs font-semibold text-navy-700 hover:bg-navy-50",
                    index % 3 !== 2 ? "border-r border-border" : "",
                    index < 3 ? "border-b border-border" : "",
                  ].join(" ")}
                >
                  <Icon size={18} className="text-telefya-blue" />
                  {label}
                </Link>
              ))}
            </div>

            <div className="border-t border-border p-4">
              <Link
                href={authed ? "/lobby" : "/contact-sales"}
                onClick={() => setOpenMenu(null)}
                className="flex h-11 items-center justify-center rounded-xl bg-telefya-blue text-sm font-semibold text-white shadow-soft hover:bg-telefya-violet"
              >
                {authed ? "Open workspace" : "Contact Sales"}
              </Link>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}