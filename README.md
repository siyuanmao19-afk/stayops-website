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
| `STAYOPS_INVITE_CODE` | Employee registration code |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push keys and contact address; set for Functions, keep the private key secret |

## Manager, employees and notifications

The existing Identity account `siyuanmao19@gmail.com` is the manager. The registration form creates employee accounts only. After login, the server links each employee email to a Softr Users record. Task ownership is checked against the linked Softr record ID on every task read and edit. Employees see only their assigned tasks; the manager sees all tasks, Properties and Analytics. Both can edit the status of tasks they can access.

AI Assistant creates a task for every request. Employee requests are assigned to the employee; manager requests stay unassigned until the manager confirms an AI-suggested employee. The Tasks screen shows pending assignments and links back to AI Assistant. The new `priority`, `priority_reason`, `recommended_staff_email` and `assignment_reason` columns in Softr Tasks store AI advice separately from task status.

Assignments create an Activity Log entry, which supplies the employee's in-app notification. For phone push, copy the generated key pair from the ignored local `.env.push.local` file to the three `VAPID_*` variables in Netlify production Functions. Keep the private key secret and redeploy after setting variables. On the employee's phone, add StayOps to the home screen if required by the browser, log in, open the bell menu and tap **Enable phone notifications**. A real phone and production HTTPS site are needed to verify lock-screen delivery.

## Softr field mapping

The live types in `src/lib/domain.ts` and the server normalisers use the existing Softr column
names, plus four AI routing fields added to the Tasks table:

- **Tasks**: `title, description, property_id, task_type, ai_summary, procedure_id, ai_recommendation, draft_response, assigned_to, status, priority, priority_reason, recommended_staff_email, assignment_reason`
- **Procedures**: `procedure_id, property_id, title, instructions, approval_rule`
- **Activity Logs**: `log_id, task_id, actor_id, action, created_at`
- **Properties**: `property_id, property_name, location, status`; an optional `image_url` (or a Softr photo/cover attachment field) supplies a property-specific photo. For the eight known locations, city photography appears when no property photo exists; other locations show a missing-photo placeholder.
- **Users**: `user_id, name, email, role, property_id`
- **Customers**: `ID number, Phone number, Room number, Property number, Nationality, Month dates staying, Duration of stay`

Reads will use `fieldNames=true`; creates and updates will use Softr field IDs.

## Property page photography

The city photographs in `public/property-images/` are local WebP copies of the following [Unsplash License](https://unsplash.com/license) images. They show the surrounding city or scenery; they are not photographs of the individual homestays. A photo URL in Softr takes precedence over these images.

| Location | Photographer | Source |
| --- | --- | --- |
| Hangzhou | Kounotori | [West Lake pavilion](https://unsplash.com/photos/traditional-pavilion-on-a-bridge-over-water-MsEHSLU2Kjg) |
| Wuzhen | Fiona Xu | [Wuzhen canal](https://unsplash.com/photos/a-small-boat-traveling-down-a-river-next-to-houses-g-Pvdxcuhq4) |
| Suzhou | Terence Zheng | [Suzhou garden](https://unsplash.com/photos/a-beautiful-chinese-garden-with-traditional-architecture-Of8w7PJk1yc) |
| Nanjing | Cheng Shi Song | [Tree-lined path](https://unsplash.com/photos/a-walkway-lined-with-trees-and-benches-in-a-park-pnD879oAJRE) |
| Dali | Wenhao Ruan | [Erhai lakeside town](https://unsplash.com/photos/a-town-on-a-lake-with-mountains-in-the-background-7TQeEZDG_Dk) |
| Lijiang | Noppon Meenuch | [Old Town rooftops](https://unsplash.com/photos/a-row-of-buildings-with-a-mountain-in-the-background-pd-eJW80j8U) |
| Xiamen | Bangyu Wang | [Gulangyu waterfront](https://unsplash.com/photos/white-and-blue-boat-on-water-near-city-buildings-during-daytime-xRi_L0sfaTQ) |
| Quanzhou | Yifei Wong | [Old brick doorway](https://unsplash.com/photos/a-door-with-chinese-writing-on-it-in-front-of-a-building-YWIgU5o23FY) |

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


