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

Open http://localhost:3000.

| Script | |
|---|---|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

## Project layout

```
src/
  app/                  routes (landing, /dashboard)
  components/
    marketing/          landing page sections
    motion/             small animation primitives
    ui/                 shadcn/ui components
  lib/                  site config, utils
```

## Roadmap

- [x] Landing page with a working multi-step demo form
- [ ] Auth and workspaces
- [ ] Drag-and-drop builder: fields, steps, validation, undo/redo
- [ ] Conditional logic (branch on answers)
- [ ] Public form pages and the embeddable `<script>` widget
- [ ] Funnel analytics: step views, completions, time on step, first-touch source
- [ ] AI form drafts from a one-line description
- [ ] Tests (Vitest, Playwright) and CI

## License

MIT
