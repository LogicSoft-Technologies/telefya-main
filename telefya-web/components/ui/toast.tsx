"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  title: string;
  description?: string;
  type?: "success" | "info" | "warning" | "danger";
  onClose?: () => void;
}

const styles = {
  success: "border-[var(--telifier-success)] bg-[var(--telifier-success-soft)]",
  info: "border-[var(--border)] bg-white",
  warning: "border-[var(--telifier-warning)] bg-[var(--telifier-warning-soft)]",
  danger: "border-[var(--telifier-danger)] bg-[var(--telifier-danger-soft)]",
};

export function Toast({ title, description, type = "info", onClose }: ToastProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-sm items-start justify-between gap-4 rounded-[14px] border p-4 shadow-[var(--telifier-shadow-md)]",
        styles[type]
      )}
    >
      <div>
        <strong className="text-sm text-[var(--foreground)]">{title}</strong>
        {description ? (
          <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{description}</p>
        ) : null}
      </div>

      {onClose ? (
        <button type="button" onClick={onClose} className="text-[var(--muted)]">
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}