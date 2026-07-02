# EXPLAINER

Notes on the reasoning behind PRAHARI X, beyond what the README covers
mechanically.

## Design choices

The brief for this project explicitly rejected "another dashboard." The
biggest risk with an operations/defense-flavored product is sliding into
either a generic admin-template look or a gamer/hacker aesthetic (neon green
terminals, glitch effects). PRAHARI X instead borrows its restraint from
enterprise fintech and productivity tools — Stripe's clarity, Linear's
motion discipline, Notion's typographic calm — applied to a command-console
subject matter.

Concretely:

- **One accent color carrying real meaning.** Sentinel Blue is the default
  interactive color; Signal Amber is reserved for priority/attention, so it
  stays meaningful instead of decorative.
- **Every page has its own visual identity but shares bones.** The landing
  page gets an orbit/radar hero and marketing rhythm; the app shell is
  quieter and denser, built for repeated daily use. Both share the same
  design tokens (`globals.css`), so switching between them never feels like
  a different product.
- **Original graphics over stock iconography.** The radar sweep, orbit
  hero, and sector-density heatmap on the Intelligence Center are bespoke
  SVG/CSS/Motion compositions rather than a literal map or stock
  illustration — partly for visual distinctiveness, partly to avoid
  implying any real-world geography or force.
- **Motion with a job to do.** Page transitions clarify navigation depth;
  staggered reveals establish reading order on dense pages; the count-up
  stats and progress bars make numeric change legible at a glance; skeleton
  states keep layout stable during data loads. Nothing animates purely for
  spectacle — the one exception granted is the marketing page, where a
  slightly more theatrical hero is appropriate.

## AI usage

The AI Assistant is intentionally the most "trust me" surface in the
product, so it was designed around three constraints: conversation history
must persist and be manageable (create/select/delete), responses should
feel grounded rather than generic, and export should produce something a
commander could actually hand off. The mock layer's canned responses
reference the same regions, mission names, and units seeded elsewhere in the
app, so the assistant reads as "aware of the operational picture" even
though it's simulated. In a real deployment, `services/api.ts`'s `aiApi`
module is the single integration point — swapping in a real LLM call means
replacing `sendMessage`'s body, not touching any UI.

## Accessibility

- All interactive primitives (`Modal`, `Drawer`, `Select`, `Tabs`, `Switch`,
  `Checkbox`, `Tooltip`, dropdown menus) are built on Radix UI, which
  provides correct ARIA roles, focus trapping, and keyboard interaction out
  of the box rather than reimplementing it.
- Focus rings are visible and consistent (`:focus-visible` in
  `globals.css`), not suppressed for aesthetics.
- Color is never the only signal — status/priority pills always pair a
  color with a dot and a text label; charts pair color with direct labels
  or tooltips.
- Text contrast was chosen against the dark surface palette to stay
  comfortably above WCAG AA for body text.
- The command palette and all primary navigation are fully keyboard
  operable (`⌘/Ctrl+K`, arrow keys, Enter, Escape).

## Challenges

- **Faithful CRUD without a live backend.** The PRD's core requirement —
  "every CRUD action should update related dashboard data" — needed to hold
  true even though the shipped frontend runs against a mock layer. The
  solution was to give the mock API real persistence (`localStorage`) and
  realistic latency, and to have every page re-derive its view from that
  single source of truth rather than caching stale copies.
- **Feeling premium without feeling heavy.** Motion-heavy UIs can easily
  become sluggish. Route-level code splitting, lazy-loaded pages, and
  keeping animations to opacity/transform (GPU-friendly properties) were
  used throughout to keep interactions snappy.
- **One design system, many page "identities."** Giving Operations,
  Intelligence, Assets, Personnel, and AI Assistant distinct visual
  personalities while keeping them unmistakably the same product required
  discipline about what varies (layout, iconography, a signature visual per
  page) versus what's fixed (tokens, spacing, component primitives).

## Future work

- Wire the frontend to the real `server/` API and remove the
  `localStorage` mock layer once a hosted Postgres instance is available.
- Real-time updates (WebSocket or SSE) for the live threat feed and
  notifications, rather than fetch-on-load.
- A genuine geospatial map layer for Intelligence Center, behind a feature
  flag, as an alternative to the abstract sector-density view.
- Server-side rendering or static prerendering of the landing page for
  faster first paint and SEO.
- Expand role-based permissions so Intelligence Officers, Mission Planners,
  Logistics Officers, and Administrators see tailored navigation and
  action sets rather than the same commander-level view.
