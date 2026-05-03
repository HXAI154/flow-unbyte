import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-light disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-[var(--color-teal)] text-white hover:bg-[var(--color-teal-light)] shadow-cta': variant === 'default',
            'border-[1.5px] border-[var(--color-blue-border)] bg-white hover:bg-[var(--color-blue-bg)] text-[var(--color-navy)]': variant === 'outline',
            'hover:bg-[var(--color-blue-bg)] text-[var(--color-navy)]': variant === 'ghost',
            'bg-[var(--color-red)] text-white hover:bg-[var(--color-red)]/90': variant === 'danger',
            'h-[42px] px-4 py-2': size === 'default',
            'h-9 px-3': size === 'sm',
            'h-11 px-8': size === 'lg',
            'h-[42px] w-[42px]': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
