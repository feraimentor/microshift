import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-calm-bg disabled:opacity-50 disabled:cursor-not-allowed rounded-lg active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-calm-accent text-calm-bg font-semibold hover:bg-calm-accentHover shadow-calm-glow focus:ring-calm-accent",
      secondary:
        "bg-calm-card hover:bg-calm-cardHover text-calm-text border border-calm-border focus:ring-calm-borderSubtle",
      outline:
        "border border-calm-border text-calm-muted hover:text-calm-text hover:border-calm-borderSubtle hover:bg-calm-card/40 focus:ring-calm-border",
      ghost:
        "text-calm-muted hover:text-calm-text hover:bg-calm-card/50 focus:ring-transparent",
      gold:
        "bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-md focus:ring-amber-400",
      danger:
        "bg-rose-600/20 text-rose-300 border border-rose-600/30 hover:bg-rose-600/30 focus:ring-rose-500",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-6 py-2.5 gap-2.5 font-semibold",
      icon: "h-9 w-9 p-0 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
