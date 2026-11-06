# AGENTS.md

StayOps is a homestay operations app: a brand story homepage plus a staff workspace (Overview,
AI Assistant, Tasks, Procedures, Properties, Activity Logs). **Continue from [PLAN.md](PLAN.md)**:
milestones 1–5 are implemented. The workspace now reads all six Softr tables, writes task edits and
Activity Logs, exposes Analytics, and includes the DeepSeek pipeline. Live-key verification and
hardening remain.

## Stack

TanStack Start (React 19 + TS + Vite 8), Tailwind 4, shadcn/ui in `src/components/ui`, sonner,
lucide-react, deployed on Netlify via `@netlify/vite-plugin-tanstack-start`.

## Key directories

```
src/
  lib/fixtures.ts            ← ALL demo data + types mirroring Softr tables + runDemoAssistant()
  components/brand/          ← Logo, SiteNav/SiteFooter (APP_NAV), RichText (**bold** only), DemoBadge
  components/home/           ← HeroCarousel, LocationGraph (custom SVG force sim)
  components/app/PageHeader  ← PageHeader, EmptyState, TypeBadge, StatusBadge, ApprovalTag
  routes/index.tsx           ← story homepage
  routes/app/route.tsx       ← workspace layout (sidebar + mobile sheet)
  routes/app/*.tsx           ← index (Overview), assistant, tasks, procedures, properties, activity
public/img/                  ← hero photos (see README for the required filenames)
```

## Non-obvious decisions

- **Softr is the only business database.** Do not add Netlify Database or Blobs for tasks/logs.
  Planned access is only via `netlify/functions/*`; the browser never calls Softr or DeepSeek.
- Secrets (`SOFTR_TOKEN`, `DEEPSEEK_KEY`) are server-only; never use `VITE_`/`PUBLIC_` prefixes.
- Swap-in point: replace imports from `@/lib/fixtures` with an API client; keep the type names.
  Remove the `DemoBadge` from a screen once it reads real data. Keep the `Demo location network`
  label until Properties has province and city fields.
- AI text is rendered with `RichText`, which supports `**bold**` only and never injects HTML.
- AI output is always a draft; keep the warning banner on the Assistant. No delete features.
- Do not show invented metrics, ratings, testimonials or partner logos.
- Hero images go through `/.netlify/images` and fall back to a branded placeholder if missing.
- Brand colors are Tailwind tokens (`bg-walnut`, `text-champagne`, `bg-ivory`, `text-stone`,
  `bg-sage`, `text-terracotta`, `bg-night` …) defined in `src/styles.css`. Headings use `font-display`.
- `prefers-reduced-motion`: carousel autoplay and Ken Burns are off, and the graph settles then stops.

## Conventions

PascalCase components, camelCase utilities, `@/` imports, strict TS (no unused vars). Every
data screen needs loading, empty, error and success states. Use typed `<Link to>` routes.

