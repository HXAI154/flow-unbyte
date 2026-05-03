import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-[var(--color-navy)] text-white": variant === "default",
          "border-transparent bg-[var(--color-green-bg)] text-[var(--color-green)]": variant === "success",
          "border-transparent bg-[var(--color-amber-bg)] text-[var(--color-amber)]": variant === "warning",
          "border-transparent bg-[var(--color-red-bg)] text-[var(--color-red)]": variant === "destructive",
          "text-foreground border-[var(--color-blue-border)]": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
