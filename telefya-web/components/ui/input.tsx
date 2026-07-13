import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="grid gap-2">
      {label ? (
        <span className="text-sm font-bold text-navy-900">{label}</span>
      ) : null}

      <input
        id={inputId}
        className={cn(
          "h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-navy-900 shadow-soft outline-none transition placeholder:text-navy-300 focus:border-telefya-blue",
          error && "border-red-500",
          className
        )}
        {...props}
      />

      {error ? (
        <span className="text-xs font-semibold text-red-600">{error}</span>
      ) : null}
    </label>
  );
}