import type { ReactNode } from "react";
import { Logo } from "@/components/marketing/logo";

const bars = [
  { label: "Opened", value: 100 },
  { label: "Name", value: 84 },
  { label: "Phone", value: 76 },
  { label: "City", value: 71, highlight: true },
  { label: "Submitted", value: 54 },
];

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Logo className="text-foreground" />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-3xl text-foreground">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground lg:text-left">Free while in beta. No card needed.</p>
      </div>

      <aside aria-hidden className="relative isolate hidden overflow-hidden bg-primary p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]" />
        <div className="absolute -bottom-40 -right-24 -z-10 size-[30rem] rounded-full bg-[radial-gradient(closest-side,rgba(253,145,204,0.45),transparent)]" />

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl bg-white p-6 text-foreground shadow-[0_40px_80px_-30px_rgba(3,15,48,0.7)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Lead form funnel</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">+21% this week</span>
            </div>
            <ul className="mt-5 space-y-3">
              {bars.map((b) => (
                <li key={b.label} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-secondary">
                    <span className={`block h-full rounded-full ${b.highlight ? "bg-brand" : "bg-primary"}`} style={{ width: `${b.value}%` }} />
                  </span>
                  <span className="text-right font-mono tabular-nums">{b.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-10 font-display text-3xl leading-tight">See the exact question where people leave, and fix it the same day.</p>
          <p className="mt-4 text-white/70">Multi-step forms, branching logic and step-by-step drop-off, in one place.</p>
        </div>
      </aside>
    </div>
  );
}
