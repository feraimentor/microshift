import React from "react";
import { cn } from "@/lib/utils";
import { SubscriptionPlan, PlanStatus } from "@/types";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "plan" | "streak" | "admin";
  plan?: SubscriptionPlan;
  planStatus?: PlanStatus;
}

export function Badge({
  className,
  variant = "default",
  plan,
  planStatus,
  children,
  ...props
}: BadgeProps) {
  if (variant === "plan" && plan) {
    const isVip = planStatus === "ACTIVE_VIP";
    const isTrial = planStatus === "TRIAL";

    let colorClasses = "bg-slate-800 text-slate-300 border-slate-700";
    if (plan === "SOVER" || isVip) {
      colorClasses = "bg-amber-500/15 text-amber-300 border-amber-500/30";
    } else if (plan === "TRACK") {
      colorClasses = "bg-sky-500/15 text-sky-300 border-sky-500/30";
    }

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase",
          colorClasses,
          className
        )}
        {...props}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {plan} {isVip ? "VIP Perpétuo" : isTrial ? "(Degustação)" : ""}
      </span>
    );
  }

  if (variant === "admin") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 tracking-wider uppercase",
          className
        )}
        {...props}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
        SUPER ADMIN
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-calm-surface text-calm-muted border border-calm-border",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
