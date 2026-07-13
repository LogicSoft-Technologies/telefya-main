"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: string[];
  value: string;
  onChange: (value: string) => void;
}

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="inline-flex rounded-[10px] border border-[var(--border)] bg-[var(--telifier-gray-50)] p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "h-8 rounded-[8px] px-3 text-sm font-semibold transition",
            value === tab
              ? "bg-white text-[var(--foreground)] shadow-[var(--telifier-shadow-sm)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}