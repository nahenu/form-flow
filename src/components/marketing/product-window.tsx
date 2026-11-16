"use client";

import { AtSign, Calendar, Check, GripVertical, ListChecks, Lock, MapPin, Phone, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { DONE, DemoFormCard, DemoFunnel, STEPS, useDemoForm } from "./live-form-demo";

const FIELDS = [
  { icon: Type, label: "Short text" },
  { icon: AtSign, label: "Email" },
  { icon: Phone, label: "Phone + OTP" },
  { icon: MapPin, label: "City" },
  { icon: ListChecks, label: "Choice" },
  { icon: Calendar, label: "Date" },
];

/** The hero: a working mock of the FormFlow builder. */
export function ProductWindow() {
  const form = useDemoForm();

  return (
    <div className="rounded-2xl border border-border/80 bg-white/80 p-1.5 shadow-[0_60px_120px_-50px_rgba(9,49,141,0.45)] sm:p-2">
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b border-border bg-muted/70 px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#d5ddef]" />
            <span className="size-2.5 rounded-full bg-[#d5ddef]" />
            <span className="size-2.5 rounded-full bg-[#d5ddef]" />
          </div>
          <div className="mx-auto flex min-w-0 items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1 text-xs text-muted-foreground">
            <Lock className="size-3 shrink-0" />
            <span className="truncate">formflow.app/builder/lead-form</span>
          </div>
          <span className="hidden rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-white sm:inline">Publish</span>
        </div>

        <div className="grid lg:grid-cols-[12.5rem_1fr_16.5rem]">
          {/* Left: steps + fields */}
          <aside className="hidden border-r border-border p-4 text-left lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Steps</p>
            <ol className="mt-2.5 space-y-1">
              {STEPS.map((s, i) => {
                const active = form.step === i;
                const done = form.step > i;
                return (
                  <li
                    key={s}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      active ? "bg-secondary font-medium text-primary" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-4.5 place-items-center rounded-full border text-[10px] font-semibold",
                        done ? "border-primary bg-primary text-white" : active ? "border-primary text-primary" : "border-input",
                      )}
                    >
                      {done ? <Check className="size-2.5" strokeWidth={4} /> : i + 1}
                    </span>
                    {s}
                  </li>
                );
              })}
              <li
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  form.step === DONE ? "bg-brand-soft font-medium text-[#b8326f]" : "text-muted-foreground",
                )}
              >
                <span className="grid size-4.5 place-items-center rounded-full border border-dashed border-input text-[10px]">✓</span>
                Thank you
              </li>
            </ol>

            <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fields</p>
            <ul className="mt-2.5 space-y-1.5">
              {FIELDS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 rounded-md border border-border bg-white px-2 py-1.5 text-[13px] text-foreground/80"
                >
                  <GripVertical className="size-3.5 text-muted-foreground/60" />
                  <Icon className="size-3.5 text-primary/70" />
                  {label}
                </li>
              ))}
            </ul>
          </aside>

          {/* Center: canvas */}
          <div className="relative bg-muted/60 bg-[radial-gradient(#d5ddef_1px,transparent_1px)] p-3 text-left [background-size:18px_18px] sm:p-10">
            <div className="mx-auto max-w-md">
              <DemoFormCard form={form} />
              <p className="mt-3 text-center text-xs text-muted-foreground">This form works. Go ahead and fill it in.</p>
            </div>
          </div>

          {/* Right: analytics */}
          <aside className="border-t border-border p-5 text-left lg:border-l lg:border-t-0">
            <DemoFunnel form={form} />
          </aside>
        </div>
      </div>
    </div>
  );
}
