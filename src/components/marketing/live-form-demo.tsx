"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PURPOSES = ["Leads", "Feedback", "Sign-ups", "RSVPs"];
const CITIES = ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai"];
export const STEPS = ["Purpose", "City", "Email"];
export const DONE = STEPS.length;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ease = [0.22, 1, 0.36, 1] as const;

export function useDemoForm() {
  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState<string>();
  const [city, setCity] = useState<string>();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [timings, setTimings] = useState<number[]>([]);
  const enteredAt = useRef(0);

  useEffect(() => {
    enteredAt.current = performance.now();
  }, [step]);

  function advance() {
    const seconds = (performance.now() - enteredAt.current) / 1000;
    setTimings((t) => {
      const next = [...t];
      next[step] = seconds;
      return next;
    });
    setStep((s) => s + 1);
  }

  return {
    step,
    purpose,
    city,
    email,
    error,
    timings,
    setCity,
    setEmail,
    choosePurpose(p: string) {
      setPurpose(p);
      setTimeout(advance, 260);
    },
    onSubmit(e: FormEvent) {
      e.preventDefault();
      if (step === 1 && city) advance();
      if (step === 2) {
        if (!EMAIL_RE.test(email.trim())) {
          setError("That doesn't look like an email address.");
          return;
        }
        setError(null);
        advance();
      }
    },
    reset() {
      setStep(0);
      setPurpose(undefined);
      setCity(undefined);
      setEmail("");
      setError(null);
      setTimings([]);
    },
  };
}

export type DemoForm = ReturnType<typeof useDemoForm>;

const primaryBtn =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

export function DemoFormCard({ form }: { form: DemoForm }) {
  const { step } = form;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-[0_1px_2px_rgba(11,29,79,0.06),0_12px_32px_-12px_rgba(11,29,79,0.18)]">
      <div className="h-1 bg-secondary" aria-hidden>
        <motion.div
          className="h-full bg-brand"
          initial={false}
          animate={{ width: `${(step / DONE) * 100}%` }}
          transition={{ duration: 0.5, ease }}
        />
      </div>

      <form onSubmit={form.onSubmit} className="min-h-[16rem] p-6" noValidate>
        <p className="text-xs font-medium text-muted-foreground">
          {step === DONE ? "Complete" : `Step ${step + 1} of ${DONE}`}
        </p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease }}
            className="mt-2"
          >
            {step === 0 && (
              <fieldset>
                <legend className="font-display text-xl text-foreground">What are you collecting?</legend>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {PURPOSES.map((p, i) => (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={form.purpose === p}
                      onClick={() => form.choosePurpose(p)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border border-input px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors",
                        "hover:border-primary/50 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                        form.purpose === p && "border-primary bg-primary text-white hover:bg-primary",
                      )}
                    >
                      <kbd
                        className={cn(
                          "grid size-5 place-items-center rounded border border-input bg-white font-mono text-[10px] text-muted-foreground",
                          form.purpose === p && "border-transparent bg-brand text-primary",
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </kbd>
                      {p}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {step === 1 && (
              <fieldset>
                <legend className="font-display text-xl text-foreground">Which city are you in?</legend>
                <p className="mt-1 text-sm text-muted-foreground">A dropdown, not a six-digit pincode.</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Select value={form.city} onValueChange={form.setCity}>
                    <SelectTrigger className="!h-10 w-full rounded-lg sm:flex-1" aria-label="City">
                      <SelectValue placeholder="Choose a city" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button type="submit" disabled={!form.city} className={primaryBtn}>
                    Next <ArrowRight className="size-4" />
                  </button>
                </div>
              </fieldset>
            )}

            {step === 2 && (
              <fieldset>
                <legend className="font-display text-xl text-foreground">Where should the summary go?</legend>
                <p className="mt-1 text-sm text-muted-foreground">Nothing is sent. This demo stays in your browser.</p>
                <div className="mt-4 grid gap-1.5">
                  <Label htmlFor="demo-email" className="sr-only">
                    Work email
                  </Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="demo-email"
                      type="email"
                      autoComplete="off"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={(e) => form.setEmail(e.target.value)}
                      aria-invalid={!!form.error}
                      aria-describedby={form.error ? "demo-email-error" : undefined}
                      className="h-10 rounded-lg sm:flex-1"
                    />
                    <button type="submit" className={primaryBtn}>
                      Submit
                    </button>
                  </div>
                  {form.error && (
                    <p id="demo-email-error" className="text-sm font-medium text-destructive">
                      {form.error}
                    </p>
                  )}
                </div>
              </fieldset>
            )}

            {step === DONE && (
              <div className="flex flex-col items-start">
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="grid size-10 place-items-center rounded-full bg-brand text-primary"
                >
                  <Check className="size-5" strokeWidth={3} />
                </motion.span>
                <h3 className="mt-4 font-display text-xl text-foreground">Response recorded</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {form.purpose} from {form.city}. Check the funnel on the right.
                </p>
                <button
                  type="button"
                  onClick={form.reset}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <RotateCcw className="size-3.5" /> Start over
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </form>
    </div>
  );
}

export function DemoFunnel({ form }: { form: DemoForm }) {
  const { step, timings } = form;
  const rows = [...STEPS, "Submitted"];

  return (
    <div aria-label="Live funnel for your visit">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Live funnel</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-[#b8326f]">
          <span className="size-1.5 animate-pulse rounded-full bg-brand" />
          Recording you
        </span>
      </div>
      <ol className="mt-5 space-y-3.5">
        {rows.map((label, i) => {
          const done = step > i || (i === DONE && step === DONE);
          const current = step === i && i < DONE;
          return (
            <li key={label}>
              <div className="flex items-center justify-between text-xs">
                <span className={cn("font-medium text-muted-foreground", (done || current) && "text-foreground")}>
                  {label}
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {current ? (
                    <span className="font-sans font-medium text-[#b8326f]">in progress</span>
                  ) : timings[i] !== undefined ? (
                    `${timings[i].toFixed(1)}s`
                  ) : done ? (
                    "done"
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className={cn("h-full rounded-full", current ? "bg-brand" : "bg-primary")}
                  initial={false}
                  animate={{ width: done ? "100%" : current ? "40%" : "0%" }}
                  transition={{ duration: 0.6, ease }}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-6 grid grid-cols-2 gap-2 border-t border-border pt-4">
        <div>
          <p className="text-[11px] text-muted-foreground">Completion</p>
          <p className="font-display text-2xl text-foreground">{step === DONE ? "100%" : `${Math.round((step / DONE) * 100)}%`}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Total time</p>
          <p className="font-display text-2xl text-foreground">
            {timings.length ? `${timings.reduce((a, b) => a + (b ?? 0), 0).toFixed(1)}s` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
