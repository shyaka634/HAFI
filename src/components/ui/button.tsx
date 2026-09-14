import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus:ring-4 focus:ring-forest-100 disabled:pointer-events-none disabled:opacity-50",
        {
          primary: "bg-forest-600 text-white shadow-sm hover:bg-forest-700",
          secondary: "border border-slate-200 bg-white text-ink hover:border-forest-200 hover:bg-forest-50",
          ghost: "text-slate-600 hover:bg-slate-100 hover:text-ink",
          danger: "bg-red-600 text-white hover:bg-red-700",
        }[variant],
        { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-sm", lg: "h-12 px-5 text-base" }[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
