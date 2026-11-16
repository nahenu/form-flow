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
| Styling | Tailwind CSS v4, shadcn/ui (Radix), Magic UI |
| Motion | Motion (`motion/react`), with `prefers-reduced-motion` respected globally |
| Type | Instrument Serif + Geist, via `next/font` |
| Hosting | Vercel |

## Design notes

- **Paper and ink.** A warm off-white background, near-black text and a single vermillion accent, used only where something needs attention (the leaky step, the CTA word). No gradients.
- **Product as proof.** The hero form is real: it validates, branches through steps, and records how long *you* spent on each one in the "Your visit" funnel underneath.
- **Hairlines over cards.** Sections are separated with rules, not drop shadows, so the few elevated surfaces (the demo, the code block) stand out.

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
