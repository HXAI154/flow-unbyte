import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[44px] w-full rounded-[9px] border-[1.5px] border-[var(--color-blue-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:border-[var(--color-teal)] focus-visible:ring-1 focus-visible:ring-[var(--color-teal)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
)
Input.displayName = "Input"

export { Input }
