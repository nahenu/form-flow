# FormFlow

[![CI](https://github.com/nahenu/form-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/nahenu/form-flow/actions/workflows/ci.yml)

Multi-step forms with per-step drop-off analytics.

Most form tools tell you how many people submitted. FormFlow tells you **which step people quit on**, so a bad field (a six-digit pincode, an OTP that never arrives) shows up on day one.

Build a form with drag and drop and conditional logic, publish it as a link or embed it on any site, and watch the funnel: how many people reached each step, where they left, how long they took, and which campaign brought them.

## Why I'm building this

At work I replaced a pincode field in our lead forms with a city dropdown. Drop-offs fell and lead volume went up noticeably. The fix was small, but finding it took far too long, because our dashboards only counted total submissions. FormFlow is the tool I wanted back then.

## Stack

| | |
|---|---|
| Framework | Next.js (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui (Radix) |
| Components | [Magic UI](https://magicui.design) (marquee, animated beam, number ticker), [Skiper UI](https://skiper-ui.com) (text roll), [Vengeance UI](https://www.vengenceui.com) (FAQ accordion, perspective grid) |
| Motion | Motion (`motion/react`), with `prefers-reduced-motion` respected globally |
| Type | Inter Tight + Inter, via `next/font` |
| Hosting | Vercel |

## Design notes

- **Three colours.** Royal blue `#09318D` carries the weight, white is the canvas, and pink `#FD91CC` is reserved for the things that need attention: the CTA, the leaky step in a funnel, the step that's in progress.
- **Product as proof.** The hero is a working mock of the builder. The form in the middle is real (it validates and moves through its steps), and the funnel on the right records how long *you* spent on each step.
- **Restraint.** No animated gimmicks on text. Motion is limited to entrances, progress and state changes.

## Running locally

```bash
npm install
cp .env.example .env.local   # then set BETTER_AUTH_SECRET
npm run dev
```

Open http://localhost:3001 (the dev and start scripts use port 3001).

**No database setup needed locally.** Without `DATABASE_URL`, FormFlow uses [PGlite](https://pglite.dev), a real Postgres compiled to WebAssembly, stored in `./.data` and migrated automatically on first request. In production, set `DATABASE_URL` to any Postgres (e.g. Neon) and run `npm run db:migrate`. The same Drizzle schema and queries run on both.

| Script | |
|---|---|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run db:generate` | Generate a SQL migration after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |

## Accounts and data

- **Auth** with [Better Auth](https://www.better-auth.com): email and password, sessions in Postgres, cookie-cached for 5 minutes.
- **Server actions** for every write (`src/app/actions/forms.ts`). Each one checks the session and ownership, and validates the form JSON with zod before saving.
- **Soft delete**, so "Undo" after deleting a form is a single update.
- **Builder autosave** is debounced and serialized: saves run one at a time, in order, so a slow request can't overwrite a newer one. The header shows Saving / Saved / Couldn't save · Retry.

## The builder

`/dashboard` lists your forms; `/builder/[id]` edits one.

- **Drag and drop** with [dnd-kit](https://dndkit.com): drag field types from the palette onto any step, reorder fields, or move them between steps. Every drag also works from the keyboard (focus a handle, Space, arrow keys, Space).
- **Undo / redo** (`Ctrl Z`, `Ctrl Shift Z`) for every change. Rapid edits to the same thing, like typing a label, collapse into a single undo step.
- **Autosave** to the server. The open form and its undo history live in a Zustand store for the session.
- **Live preview** renders the real multi-step form, with validation, at desktop or phone width.

All edits go through small pure functions in `src/lib/forms/operations.ts`, which the store applies to a cloned draft. That keeps the UI thin and the logic easy to unit test.

## Conditional logic

Any question can have a rule: *show this only if* an earlier answer **is**, **is not**, **is answered** or **is empty**. The engine lives in `src/lib/forms/logic.ts` and is pure, so the builder, the preview and (later) public forms share it.

- **Steps branch automatically.** A step whose questions are all hidden is skipped, so "Bengaluru → visit a studio, everyone else → video call" needs no special step logic.
- **Chains collapse.** Answers to hidden questions count as empty, so if A hides B, anything that depends on B hides too.
- **Rules only look backwards.** The editor only offers earlier questions. If a question is dragged below the one that depends on it, the rule is ignored at runtime (the question stays visible rather than vanishing) and the builder flags it.
- **No dangling rules.** Deleting a question (or its step) removes rules that used it, and the toast offers Undo.

Covered by unit tests in `logic.test.ts` and `operations.test.ts`.

## Flow builder

The **Flow** tab draws the form as a flowchart (built on [React Flow](https://reactflow.dev)): Start, one card per step, End.

- **Drag the blue dot** on the right of a step to a later step, or to End, to add a **route**: *if City is Bengaluru, go to "Visit a studio"*. Click a line to change its condition or destination.
- **Drag the bottom dot** to change where everyone else goes (the dashed "Otherwise" line).
- Routes are checked in order and the first match wins. They **only go forward**, so a form can never loop; backward connections are refused.
- Steps reached only through a route are laid out in a side column, and each route gets its own lane, so branches read as branches. Cards can be dragged; **Auto-arrange** puts them back. Undo and redo cover everything, including moving cards.

One function, `resolveFlow()` in `src/lib/forms/logic.ts`, walks the form with the respondent's answers and returns the steps they'll see and the questions that are visible. The builder preview, the public form and server-side validation all call it, so they can't disagree. Answers to steps that were skipped count as empty, and routes that point backwards or test a later question are ignored and flagged in the editor. Covered by `flow.test.ts` and `tests/e2e/flow.spec.ts`.

## Publishing, responses and tracking

- **Publish snapshots.** Publishing copies the editor's version into a separate `published` column, so authors can keep editing without changing the live form. The builder shows *Publish changes* when the two differ (compared with key-sorted JSON, since Postgres jsonb reorders keys).
- **Public forms** live at `/f/[id]`. Submissions go through a server action that **re-validates every answer** against the published form with the same visibility rules, drops hidden or unknown answers, and caps sizes. A hidden honeypot field filters simple bots.
- **Funnel events** (`view`, `step_view`, `step_complete` with time on step) are batched in the browser and sent with `sendBeacon`, so they survive the tab closing. `/api/events` validates them with zod and always fails quietly: analytics must never break a form.
- **First-touch attribution.** UTM tags and the referrer are captured on a visitor's first visit and attached to their events and response.

## Results and funnel analytics

`/forms/[id]/results` shows, for 7 days, 30 days or all time:

- **KPIs**: completion rate (the headline), unique visitors, how many finished step 1, submissions, median time to submit.
- **Funnel**: one row per step with how many unique visitors reached it, how many left there, and the median time spent. The step that loses the largest share of the people who saw it is called out ("Biggest drop-off"). Drop-off is measured per step (saw it, didn't finish it), so steps that some people skip because of conditional logic don't look like losses.
- **Submissions per day** and **first-touch sources** with conversion per source.
- **Responses table** and **CSV export**. Export is ownership-checked, UTF-8 with a BOM for Excel, and guarded against CSV formula injection.

Charts are plain HTML and CSS: server-rendered, no chart library, tooltips on hover and keyboard focus. They follow a validated palette. Blue carries the data. Pink only emphasises the one step that matters, and it always comes with a text label and icon, because pink on white is below 3:1 contrast.

### Demo data

In development, `POST /api/dev/seed` creates `demo@formflow.dev` / `formflow-demo` with a published lead form and four weeks of simulated traffic (about 560 visitors). The generator is seeded, so the numbers are the same every run. In production the route only answers with the `x-seed-secret` header matching `SEED_SECRET`.

```bash
curl -X POST http://localhost:3001/api/dev/seed
```

## Embedding

```html
<div data-formflow="FORM_ID"></div>
<script async src="https://YOUR-HOST/embed.js"></script>
```

`public/embed.js` is about 50 lines of dependency-free JavaScript. It renders the form in an iframe so the host page's CSS can't leak in, resizes the frame to fit through `postMessage` (accepting messages only from the FormFlow origin), and forwards the host page's UTM tags and referrer.

## Project layout

```
public/embed.js         embed script
src/
  app/                  routes: landing, auth, /dashboard, /builder/[id], /f/[id], /api/*
  app/actions/          server actions (forms, responses)
  components/
    app/                dashboard
    builder/            builder panes, canvas, inspector, share dialog
    forms/              form renderer (preview + public), public form
    marketing/          landing page sections
    ui/                 shadcn/ui and adapted library components
  db/                   Drizzle schema and client (PGlite / Neon)
  lib/
    forms/              types, logic, validation, operations, store, server queries
drizzle/                SQL migrations
```

## Testing

| | |
|---|---|
| `npm test` | **Unit tests** (Vitest) for the pure logic: conditional visibility, submission validation, edit operations, key-order-independent JSON. |
| `npm run test:e2e` | **End-to-end tests** (Playwright) against a production build on port 3100, with a throwaway database that is wiped each run. |
| `npm run test:e2e:ui` | The same, in Playwright's interactive UI. |

The end-to-end suite covers what a user actually does:

- **Auth**: protected routes redirect and come back, sign up, sign out, a wrong password, and a regression check that credentials never reach the URL.
- **Builder**: autosave survives a reload, grouped undo/redo, adding from the palette, keyboard-only reordering (waiting on the screen-reader announcements, the way a user would), conditional logic in the preview.
- **Publishing**: a respondent from an Instagram campaign submits; the owner sees the response, its source and the CSV export; edits stay private until republished; unpublishing kills the link.
- **Security**: another account gets a 404 for your builder, results and export; signed-out export is a 401; the events endpoint rejects bad input.
- **Embed**: the script runs on a separate origin, forwards UTM tags and resizes the frame.
- **Accessibility**: axe finds no serious or critical WCAG 2.1 A/AA issues on the landing, sign-in, dashboard, builder and public form.
- **Mobile**: no horizontal scroll, and the builder's field strip and settings sheet work on a Pixel 7.

[GitHub Actions](.github/workflows/ci.yml) runs lint, unit tests and the full end-to-end suite on every push and pull request.

## Roadmap

- [x] Landing page with a working multi-step demo form
- [x] Drag-and-drop builder: fields, steps, validation, undo/redo, autosave, preview
- [x] Conditional logic: show questions and skip steps based on earlier answers
- [x] Accounts (email and password, remember me, password reset) and Postgres storage
- [x] Visual flow builder: drag-to-connect routes between steps
- [x] Publishing, public form pages, responses and the embeddable `<script>` widget
- [x] Funnel analytics: step drop-off, time on step, first-touch sources, CSV export
- [ ] AI form drafts from a one-line description
- [x] Unit tests for form logic and operations (Vitest)
- [x] End-to-end and accessibility tests (Playwright, axe) and CI

## License

MIT
