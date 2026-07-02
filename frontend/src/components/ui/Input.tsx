import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: string;
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, label, hint, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-[color:var(--color-ink-2)]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-ink-3)] [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-10 w-full rounded-[var(--radius-sm)] border bg-[color:var(--color-surface)] px-3 text-sm text-[color:var(--color-ink-0)] placeholder:text-[color:var(--color-ink-3)] transition-colors duration-150",
              "border-[color:var(--color-border-strong)] focus:border-[color:var(--color-sentinel-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-sentinel-500)]/25",
              icon && "pl-9",
              error && "border-[color:var(--color-danger-500)] focus:ring-[color:var(--color-danger-500)]/25",
              className
            )}
            aria-invalid={Boolean(error)}
            {...props}
          />
        </div>
        {hint && !error && <p className="mt-1.5 text-xs text-[color:var(--color-ink-3)]">{hint}</p>}
        {error && <p className="mt-1.5 text-xs text-[color:var(--color-danger-400)]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-[color:var(--color-ink-2)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "min-h-[96px] w-full resize-y rounded-[var(--radius-sm)] border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm text-[color:var(--color-ink-0)] placeholder:text-[color:var(--color-ink-3)] transition-colors duration-150 focus:border-[color:var(--color-sentinel-500)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-sentinel-500)]/25",
            error && "border-[color:var(--color-danger-500)]",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-[color:var(--color-danger-400)]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
