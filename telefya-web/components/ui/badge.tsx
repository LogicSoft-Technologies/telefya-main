import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "blue" | "green" | "purple" | "gold" | "gray" | "red";

const variants: Record<BadgeVariant, string> = {
  blue: "bg-blue-50 text-telefya-blue",
  green: "bg-green-50 text-telefya-green",
  purple: "bg-purple-50 text-telefya-violet",
  gold: "bg-yellow-50 text-telefya-gold",
  gray: "bg-navy-50 text-navy-500",
  red: "bg-red-50 text-red-600",
};

export function Badge({
  className,
  variant = "blue",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-black",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}