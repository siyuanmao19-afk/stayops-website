# StayOps product roadmap

StayOps is a homestay operations workspace: a brand story site plus an AI-assisted back office
(Overview, AI Assistant, Tasks, Procedures, Properties, Activity Logs). The existing **Softr
Database** stays the only business database, reached only from Netlify Functions.

Each milestone is a small, self-contained piece of work. Continue from the first unchecked one.

## ✅ Milestone 1 — Product surface (done)

- Brand system (palette, Cormorant Garamond + Manrope, radii, shadows, focus rings, reduced motion).
- Story homepage: hero with photo carousel, pain points, three capabilities, Obsidian-style
  location graph (“Every stay, connected.”), AI workflow + product preview, safety section, CTA, footer.
- Workspace shell and six screens: Overview, AI Assistant (six-section result, Copy / Edit draft /
  Save changes / Mark as reviewed), Tasks (cards/table, search, filters, draft + status edit),
  Procedures, Properties, Activity Logs.
- All data comes from `src/lib/fixtures.ts` and is labelled “Demo data” on screen.

## Milestone 2 — Softr read layer

- `netlify/functions/_lib/softr.ts`: fetch wrapper for `https://tables-api.softr.io/api/v1`
  with the `Softr-Api-Key` header from `SOFTR_TOKEN`; reads use `fieldNames=true`; maps
  401/403/429/5xx to safe, user-facing errors (no token or raw body in logs).
- A field map module (Softr field IDs ↔ app names) for Tasks, Procedures, Activity Logs, Properties,
  confirmed against the real tables.
- `GET` functions: `properties`, `tasks`, `procedures`, `activity-logs`, `task?id=`.
- Simple pagination and short CDN caching on read endpoints.

## Milestone 3 — Wire screens to live data

- Replace `fixtures.ts` imports with a small client (`src/lib/api.ts`) calling `/.netlify/functions/*`.
- Loading skeletons, empty states, error states with retry on every screen.
- Remove the “Demo data” badge on screens backed by Softr; keep `Demo location network` on the
  graph until Properties has `province` / `city` fields.
- Overview counts computed from real Tasks only.

## Milestone 4 — Task editing

- `PATCH task-draft`: validates task ID, `draft_response` (≤ 2000 chars) and status (allowed list);
  writes using Softr **field IDs**; never touches the original AI fields.
- Appends a Staff entry to Activity Logs for every edit / status change / “Mark as reviewed”.

## Milestone 5 — AI Assistant pipeline

- `POST assistant`: validate property + question (length limits) → create Task in Softr → read
  that property’s Procedures → call DeepSeek (`DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`, key from
  `DEEPSEEK_KEY`) with the allowed procedure-ID list, demanding strict JSON.
- Server re-validates task type, procedure ID and field lengths; `N/A` or unknown IDs become empty
  with “No verified procedure match” (request still succeeds). Prompt forbids promising refunds,
  compensation or prices.
- Update Task AI fields, append an AI entry to Activity Logs, return the six-section result.
- If latency requires it: a background function plus polling every 4 s from the browser, with a
  hard stop after ~2 minutes.

## Milestone 6 — Location network from real data

- Build provinces/cities from Properties fields once available; property counts and pending task
  counts from Tasks. Keep the accessible text list in sync.

## Milestone 7 — Hardening

- Rate limiting on `assistant`, input sanitisation review, error-path tests, README test checklist
  run against the real Softr base.
