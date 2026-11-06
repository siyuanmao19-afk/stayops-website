# StayOps — Manage Your Homestay Smarter

StayOps is a homestay operations workspace: a warm brand story site plus an AI-assisted back office
where staff turn guest enquiries into reviewed, procedure-aware actions with a full audit trail.

The product surface includes the story homepage, an interactive province/city graph and the
workspace screens: **Overview, AI Assistant, Tasks, Procedures, Properties, Analytics and Activity
Logs**. Workspace data is loaded from the existing **Softr Database** through server-only Netlify
Functions. Task edits write back to Softr and append an Activity Log entry.

## Tech stack

- TanStack Start (React 19, TypeScript, Vite) on Netlify
- Tailwind CSS 4 with brand theme variables in `src/styles.css`
- shadcn/ui (Radix) components, lucide icons, sonner toasts
- Netlify Image CDN for the hero photos
- Netlify Functions are the only path to Softr and DeepSeek

## Run locally

```bash
pnpm install
netlify dev          # http://localhost:8888 (includes the Image CDN)
# or: pnpm dev       # Vite only on http://localhost:3000
```

## Hero photos

The carousel uses the three photos supplied for StayOps. They are included in `public/img/`
with these names:

| Original file                           | Save as                              | Scene                         |
| --------------------------------------- | ------------------------------------ | ----------------------------- |
| `downloaded-image (1).png`              | `public/img/stayops-night-exterior.png` | Homestay exterior at night |
| `1a57e9292a5245a082c1405bd1b81d96.jpeg` | `public/img/stayops-wooden-room.jpeg`   | Wooden room, village view  |
| `downloaded-image.png`                  | `public/img/stayops-modern-suite.png`   | Bright suite with bathtub  |

## Environment variables

Set these in **Netlify → Project configuration → Environment variables**. They are server-only:
never use `VITE_`, `NEXT_PUBLIC_` or `PUBLIC_` prefixes, and never commit values.
`.env.example` lists the names with empty values.

| Variable | Purpose |
| --- | --- |
| `SOFTR_TOKEN` | Softr personal access token (secret) |
| `SOFTR_DATABASE_ID` | Softr database ID |
| `SOFTR_PROPERTIES_TABLE_ID` / `SOFTR_USERS_TABLE_ID` / `SOFTR_PROCEDURES_TABLE_ID` / `SOFTR_TASKS_TABLE_ID` / `SOFTR_ACTIVITY_LOGS_TABLE_ID` / `SOFTR_CUSTOMERS_TABLE_ID` | All six table IDs |
| `AI_SERVICE` | AI provider selector |
| `DEEPSEEK_KEY` | DeepSeek API key (secret) |
| `DEEPSEEK_BASE_URL` / `DEEPSEEK_MODEL` | DeepSeek endpoint and model |

## Softr field mapping

The live types in `src/lib/domain.ts` and the server normalisers use the existing Softr column
names without changing the table schema:

- **Tasks**: `title, description, property_id, task_type, ai_summary, procedure_id, ai_recommendation, draft_response, assigned_to, status`
- **Procedures**: `procedure_id, property_id, title, instructions, approval_rule`
- **Activity Logs**: `log_id, task_id, actor_id, action, created_at`
- **Properties**: `property_id, property_name, location, status`
- **Users**: `user_id, name, email, role, property_id`
- **Customers**: `ID number, Phone number, Room number, Property number, Nationality, Month dates staying, Duration of stay`

Reads will use `fieldNames=true`; creates and updates will use Softr field IDs.

## Common Softr API errors

- **401**: token missing or invalid. Check `SOFTR_TOKEN` is set for the deploy context.
- **403**: the token can't access that database or table. Check the IDs and token scope.
- **429**: rate limited. The functions will back off and show a "try again" state.

## Roadmap

1. ✅ Product surface: homepage, location graph and workspace screens
2. ✅ Softr read layer covering all six tables
3. ✅ Workspace screens wired to live Softr data
4. ✅ Task draft and status editing, with Activity Log entries
5. ✅ AI Assistant pipeline implemented (requires Netlify environment variables and live verification)
6. Location network from real province and city data
7. Hardening and test checklist

Details in [PLAN.md](PLAN.md).

