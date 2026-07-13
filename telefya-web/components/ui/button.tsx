import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-telefya-blue text-white shadow-soft hover:bg-telefya-violet",
  secondary:
    "border border-border bg-white text-navy-900 hover:border-telefya-blue hover:text-telefya-blue",
  ghost:
    "bg-transparent text-navy-500 hover:bg-navy-50 hover:text-navy-900",
  danger:
    "bg-red-600 text-white hover:bg-red-700",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}