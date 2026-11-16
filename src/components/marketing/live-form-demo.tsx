"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
const STEPS = ["Purpose", "City", "Email"];
const DONE = STEPS.length;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ease = [0.22, 1, 0.36, 1] as const;

export function LiveFormDemo() {
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

  function reset() {
    setStep(0);
    setPurpose(undefined);
    setCity(undefined);
    setEmail("");
    setError(null);
    setTimings([]);
  }

  function onSubmit(e: FormEvent) {
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
  }

  return (
    <div className="w-full">
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-0 translate-x-2.5 translate-y-3 rotate-[1.4deg] rounded-lg border border-rule bg-card/70"
        />
        <div className="relative overflow-hidden rounded-lg border border-rule bg-card shadow-[0_1px_0_rgba(22,21,19,0.04),0_30px_60px_-30px_rgba(22,21,19,0.35)]">
          <div className="flex items-center justify-between border-b border-rule px-6 py-3">
            <span className="eyebrow">Lead form · live</span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {String(Math.min(step + 1, DONE)).padStart(2, "0")} / {String(DONE).padStart(2, "0")}
            </span>
          </div>

          <div className="flex gap-1 px-6 pt-4" aria-hidden>
            {STEPS.map((_, i) => (
              <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full bg-foreground"
                  initial={false}
                  animate={{ width: step > i ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease }}
                />
              </div>
            ))}
          </div>

          <form onSubmit={onSubmit} className="min-h-[16.5rem] px-6 pb-7 pt-6" noValidate>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.28, ease }}
              >
                {step === 0 && (
                  <fieldset>
                    <legend className="font-display text-[2rem]">What are you collecting?</legend>
                    <p className="mt-2 text-sm text-muted-foreground">Pick one. It moves on by itself.</p>
                    <div className="mt-6 grid grid-cols-2 gap-2">
                      {PURPOSES.map((p, i) => (
                        <button
                          key={p}
                          type="button"
                          aria-pressed={purpose === p}
                          onClick={() => {
                            setPurpose(p);
                            setTimeout(advance, 240);
                          }}
                          className={cn(
                            "group flex items-center gap-3 rounded-md border border-input px-3 py-2.5 text-left text-sm transition-colors",
                            "hover:border-foreground/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                            purpose === p && "border-foreground bg-foreground text-background",
                          )}
                        >
                          <kbd
                            className={cn(
                              "grid size-5 place-items-center rounded-[3px] border border-input font-mono text-[10px] text-muted-foreground",
                              purpose === p && "border-background/30 text-background/80",
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
                    <legend className="font-display text-[2rem]">Which city are you in?</legend>
                    <p className="mt-2 text-sm text-muted-foreground">
                      A dropdown, not a six-digit pincode.{" "}
                      <a href="#funnel" className="underline decoration-rule underline-offset-4 hover:decoration-foreground">
                        There&apos;s a reason.
                      </a>
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Select value={city} onValueChange={setCity}>
                        <SelectTrigger className="h-10 w-full bg-background sm:flex-1" aria-label="City">
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
                      <Button type="submit" disabled={!city} className="h-10 px-4">
                        Next <ArrowRight />
                      </Button>
                    </div>
                  </fieldset>
                )}

                {step === 2 && (
                  <fieldset>
                    <legend className="font-display text-[2rem]">Where should the summary go?</legend>
                    <p className="mt-2 text-sm text-muted-foreground">Nothing is sent. This demo never leaves your browser.</p>
                    <div className="mt-6 grid gap-2">
                      <Label htmlFor="demo-email" className="text-xs text-muted-foreground">
                        Work email
                      </Label>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Input
                          id="demo-email"
                          type="email"
                          autoComplete="off"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          aria-invalid={!!error}
                          aria-describedby={error ? "demo-email-error" : undefined}
                          className="h-10 bg-background sm:flex-1"
                        />
                        <Button type="submit" className="h-10 px-4">
                          Submit
                        </Button>
                      </div>
                      {error && (
                        <p id="demo-email-error" className="text-sm text-brand">
                          {error}
                        </p>
                      )}
                    </div>
                  </fieldset>
                )}

                {step === DONE && (
                  <div className="flex flex-col items-start">
                    <svg viewBox="0 0 48 48" className="size-12 text-brand" aria-hidden>
                      <motion.circle
                        cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease }}
                      />
                      <motion.path
                        d="M15 24.5l6 6 12-13" fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.45, ease }}
                      />
                    </svg>
                    <h3 className="mt-5 font-display text-[2rem]">That&apos;s a finished form.</h3>
                    <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                      {purpose} from {city}. Three steps, no friction. Your own funnel is below.
                    </p>
                    <Button type="button" variant="ghost" onClick={reset} className="-ml-2.5 mt-5 h-8 text-muted-foreground">
                      <RotateCcw /> Run it again
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </div>
      </div>

      <SessionFunnel step={step} timings={timings} />
    </div>
  );
}

function SessionFunnel({ step, timings }: { step: number; timings: number[] }) {
  const rows = [...STEPS, "Submitted"];

  return (
    <div className="mt-8 pl-1" aria-label="Your session funnel">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow">Your visit, as FormFlow sees it</span>
        <span className="font-mono text-[11px] text-muted-foreground">time on step</span>
      </div>
      <ol className="mt-3 space-y-2.5">
        {rows.map((label, i) => {
          const done = step > i || (i === DONE && step === DONE);
          const current = step === i && i < DONE;
          return (
            <li key={label} className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-3 text-xs">
              <span className={cn("text-muted-foreground transition-colors", (done || current) && "text-foreground")}>
                {label}
              </span>
              <span className="relative h-px bg-rule">
                <motion.span
                  className={cn("absolute inset-y-0 left-0 h-px", current ? "bg-brand" : "bg-foreground")}
                  initial={false}
                  animate={{ width: done ? "100%" : current ? "35%" : "0%" }}
                  transition={{ duration: 0.6, ease }}
                />
              </span>
              <span className="text-right font-mono tabular-nums text-muted-foreground">
                {current ? (
                  <span className="inline-flex items-center gap-1.5 text-brand">
                    <span className="size-1.5 animate-pulse rounded-full bg-brand" />
                    now
                  </span>
                ) : timings[i] !== undefined ? (
                  `${timings[i].toFixed(1)}s`
                ) : done ? (
                  "✓"
                ) : (
                  "—"
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
