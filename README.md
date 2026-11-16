# FormFlow

Multi-step forms with per-step drop-off analytics.

Most form tools tell you how many people submitted. FormFlow tells you **which step people quit on**, so a bad field (a six-digit pincode, an OTP that never arrives) shows up on day one.

> Status: early. The landing page and live demo are done. The builder is in progress. See the [roadmap](#roadmap).

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

## Project layout

```
src/
  app/                  routes: landing, /dashboard, /builder/[id]
  components/
    app/                dashboard
    builder/            builder panes, canvas, inspector
    forms/              form renderer (preview now, public pages later)
    marketing/          landing page sections
    ui/                 shadcn/ui and adapted library components
  lib/
    forms/              types, field definitions, operations, store, templates
```

## Roadmap

- [x] Landing page with a working multi-step demo form
- [x] Drag-and-drop builder: fields, steps, validation, undo/redo, autosave, preview
- [x] Conditional logic: show questions and skip steps based on earlier answers
- [ ] Auth, workspaces and database sync
- [ ] Public form pages and the embeddable `<script>` widget
- [ ] Funnel analytics: step views, completions, time on step, first-touch source
- [ ] AI form drafts from a one-line description
- [x] Unit tests for form logic and operations (Vitest)
- [ ] End-to-end tests (Playwright) and CI

## License

MIT
