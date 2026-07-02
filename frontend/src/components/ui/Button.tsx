import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] font-medium transition-all duration-200 ease-[var(--ease-out-quart)] disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "bg-[color:var(--color-sentinel-500)] text-white shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_8px_24px_-8px_rgba(57,160,110,0.55)] hover:bg-[color:var(--color-sentinel-400)]",
        secondary:
          "bg-[color:var(--color-surface-3)] text-[color:var(--color-ink-0)] border border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-surface-4)] hover:border-[color:var(--color-ink-4)]",
        outline:
          "border border-[color:var(--color-border-strong)] text-[color:var(--color-ink-1)] hover:bg-white/5 hover:text-[color:var(--color-ink-0)]",
        ghost: "text-[color:var(--color-ink-2)] hover:bg-white/5 hover:text-[color:var(--color-ink-0)]",
        danger:
          "bg-[color:var(--color-danger-500)]/15 text-[color:var(--color-danger-400)] border border-[color:var(--color-danger-500)]/30 hover:bg-[color:var(--color-danger-500)]/25",
        amber:
          "bg-[color:var(--color-amber-500)] text-[#1a1002] shadow-[0_8px_24px_-8px_rgba(255,176,32,0.55)] hover:bg-[color:var(--color-amber-400)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, icon, iconRight, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          icon && <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        )}
        {children}
        {!loading && iconRight && <span className="[&>svg]:h-4 [&>svg]:w-4">{iconRight}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";
