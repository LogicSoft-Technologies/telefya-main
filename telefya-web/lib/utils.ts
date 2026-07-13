import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function decodeStoredText(value: string) {
  if (typeof window === "undefined") return value;

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}