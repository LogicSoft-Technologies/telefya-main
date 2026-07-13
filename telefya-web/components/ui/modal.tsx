"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function Modal({ open, title, description, children, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <section className="w-full max-w-lg rounded-[16px] border border-[var(--border)] bg-white p-5 shadow-[var(--telifier-shadow-lg)]">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-lg font-bold text-[var(--foreground)]">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
            ) : null}
          </div>

          <Button variant="ghost" className="h-9 w-9 px-0" onClick={onClose}>
            <X size={18} />
          </Button>
        </header>

        {children}
      </section>
    </div>
  );
}