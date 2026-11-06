# StayOps — Manage Your Homestay Smarter

StayOps is a homestay operations workspace: a warm brand story site plus an AI-assisted back office
where staff turn guest enquiries into reviewed, procedure-aware actions with a full audit trail.

The product surface is live and clickable: the story homepage (with a photo carousel and an
interactive province/city graph) and the workspace screens: **Overview, AI Assistant, Tasks,
Procedures, Properties and Activity Logs**. These screens currently run on clearly labelled demo
data from `src/lib/fixtures.ts`. Connecting them to the existing **Softr Database** and the
DeepSeek model through Netlify Functions is the next part of the roadmap (see [PLAN.md](PLAN.md)).

## Tech stack

- TanStack Start (React 19, TypeScript, Vite) on Netlify
- Tailwind CSS 4 with brand theme variables in `src/styles.css`
- shadcn/ui (Radix) components, lucide icons, sonner toasts
- Netlify Image CDN for the hero photos
- Coming next: Netlify Functions as the only path to Softr and DeepSeek

## Run locally

```bash
pnpm install
netlify dev          # http://localhost:8888 (includes the Image CDN)
# or: pnpm dev       # Vite only on http://localhost:3000
```

## Hero photos

The carousel uses the three photos supplied for StayOps. Copy them into `public/img/`
with these names:

| Original file                           | Save as                              | Scene                         |
| --------------------------------------- | ------------------------------------ | ----------------------------- |
| `downloaded-image (1).png`              | `public/img/stayops-night-exterior.png` | Homestay exterior at night |
| `1a57e9292a5245a082c1405bd1b81d96.jpeg` | `public/img/stayops-wooden-room.jpeg`   | Wooden room, village view  |
| `downloaded-image.png`                  | `public/img/stayops-modern-suite.png`   | Bright suite with bathtub  |

Until a file is added, its slide shows a branded placeholder naming the missing photo, never a
stock image.

## Environment variables (for the Softr / AI milestones)

Set these in **Netlify → Project configuration → Environment variables**. They are server-only:
never use `VITE_`, `NEXT_PUBLIC_` or `PUBLIC_` prefixes, and never commit values.
`.env.example` lists the names with empty values.

| Variable | Purpose |
| --- | --- |
| `SOFTR_TOKEN` | Softr personal access token (secret) |
| `SOFTR_DATABASE_ID` | Softr database ID |
| `SOFTR_TASKS_TABLE_ID` / `SOFTR_PROCEDURES_TABLE_ID` / `SOFTR_ACTIVITY_LOGS_TABLE_ID` / `SOFTR_PROPERTIES_TABLE_ID` | Table IDs |
| `AI_SERVICE` | AI provider selector |
| `DEEPSEEK_KEY` | DeepSeek API key (secret) |
| `DEEPSEEK_BASE_URL` / `DEEPSEEK_MODEL` | DeepSeek endpoint and model |

## Softr field mapping (planned)

The demo types in `src/lib/fixtures.ts` already use the Softr column names:

- **Tasks**: `title, description, property_id, task_type, ai_summary, procedure_id, ai_recommendation, draft_response, assigned_to, status`
- **Procedures**: `procedure_id, property_id, title, instructions, approval_rule`
- **Activity Logs**: `task, actor, action, created_at`
- **Properties**: `property_id, name, city, province, status`

Reads will use `fieldNames=true`; creates and updates will use Softr field IDs.

## Common Softr API errors (for the next milestones)

- **401**: token missing or invalid. Check `SOFTR_TOKEN` is set for the deploy context.
- **403**: the token can't access that database or table. Check the IDs and token scope.
- **429**: rate limited. The functions will back off and show a "try again" state.

## Roadmap

1. ✅ Product surface: homepage, location graph, six workspace screens on demo data
2. Softr read layer (Netlify Functions)
3. Screens wired to live Softr data
4. Task draft and status editing, with Activity Log entries
5. AI Assistant pipeline (Softr + DeepSeek, strict JSON, server validation)
6. Location network from real province and city data
7. Hardening and test checklist

Details in [PLAN.md](PLAN.md).
