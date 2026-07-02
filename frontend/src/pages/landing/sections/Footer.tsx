import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

const COLUMNS = [
  {
    title: "Platform",
    links: ["Dashboard", "Operations", "Intelligence", "Assets", "Personnel", "AI Assistant"],
  },
  {
    title: "Company",
    links: ["About", "Security", "Careers", "Contact"],
  },
  {
    title: "Resources",
    links: ["Documentation", "API Reference", "Status", "Changelog"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-border)] px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-sentinel-500)]">
                <ShieldCheck className="h-[18px] w-[18px] text-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-[color:var(--color-ink-0)]">PRAHARI X</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-[color:var(--color-ink-3)]">
              A fictional AI defense operations command platform, built as a demonstration of enterprise
              product design and engineering craft.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-3)]">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-ink-0)]">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="divider-fade my-10" />
        <div className="flex flex-col items-center justify-between gap-4 text-xs text-[color:var(--color-ink-4)] md:flex-row">
          <p>© 2026 PRAHARI X. All rights reserved. Fictional product for demonstration purposes only.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[color:var(--color-ink-2)]">Privacy</a>
            <a href="#" className="hover:text-[color:var(--color-ink-2)]">Terms</a>
            <a href="#" className="hover:text-[color:var(--color-ink-2)]">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
