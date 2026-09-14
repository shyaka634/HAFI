import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Small helper used by the UI components. It keeps Tailwind class names tidy.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId() {
  return crypto.randomUUID();
}
