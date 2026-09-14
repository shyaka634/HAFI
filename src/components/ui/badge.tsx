import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-full bg-forest-50 px-2.5 py-1 text-xs font-semibold text-forest-700", className)} {...props} />;
}
