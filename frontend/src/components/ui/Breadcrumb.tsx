import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[color:var(--color-ink-4)]" />}
          {item.to ? (
            <Link to={item.to} className="text-[color:var(--color-ink-3)] transition-colors hover:text-[color:var(--color-ink-0)]">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-[color:var(--color-ink-0)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
