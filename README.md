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
npm run dev
```

Open http://localhost:3001 (the dev and start scripts use port 3001).

| Script | |
|---|---|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## The builder

`/dashboard` lists your forms; `/builder/[id]` edits one.

- **Drag and drop** with [dnd-kit](https://dndkit.com): drag field types from the palette onto any step, reorder fields, or move them between steps. Every drag also works from the keyboard (focus a handle, Space, arrow keys, Space).
- **Undo / redo** (`Ctrl Z`, `Ctrl Shift Z`) for every change. Rapid edits to the same thing, like typing a label, collapse into a single undo step.
- **Autosave**: forms persist to `localStorage` through a Zustand store. Only the forms are saved; undo history is per session.
- **Live preview** renders the real multi-step form, with validation, at desktop or phone width.

All edits go through small pure functions in `src/lib/forms/operations.ts`, which the store applies to a cloned draft. That keeps the UI thin and the logic easy to unit test.

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
- [ ] Auth, workspaces and database sync
- [ ] Conditional logic (branch on answers)
- [ ] Public form pages and the embeddable `<script>` widget
- [ ] Funnel analytics: step views, completions, time on step, first-touch source
- [ ] AI form drafts from a one-line description
- [ ] Tests (Vitest, Playwright) and CI

## License

MIT
