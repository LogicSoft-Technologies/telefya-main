"use client";

import { Loader2 } from "lucide-react";
import { PlatformSidebar } from "@/components/platform/platform-sidebar";
import { PlatformTopbar } from "@/components/platform/platform-topbar";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, checking } = useAuthGuard();

  if (checking) {
    return (
      <main className="grid min-h-dvh place-items-center bg-navy-50 px-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-5 py-4 font-bold text-navy-700 shadow-soft">
          <Loader2 size={18} className="animate-spin text-telefya-blue" />
          Loading workspace...
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-navy-50">
      <PlatformSidebar />

      <div className="min-h-dvh lg:pl-[278px]">
        <PlatformTopbar user={user} />

        <main className="h-[calc(100dvh-64px)] overflow-y-auto overscroll-contain px-4 py-5 pb-10 sm:h-[calc(100dvh-68px)] sm:px-5 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}