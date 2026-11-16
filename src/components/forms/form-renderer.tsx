"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Loader2, RotateCcw, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { resolveFlow } from "@/lib/forms/logic";
import type { Field, FormDefinitionLike } from "@/lib/forms/types";
import { validateField } from "@/lib/forms/validation";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const now = () => performance.now();
const msSince = (start: number) => Math.round(now() - start);

type Answers = Record<string, string>;

export type SubmitResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export interface FormTracker {
  stepView: (stepId: string) => void;
  stepComplete: (stepId: string, durationMs: number) => void;
}

interface FormRendererProps {
  form: FormDefinitionLike & { title: string };
  className?: string;
  /** When given, the last step really submits. Without it the renderer is a preview. */
  onSubmit?: (answers: Answers) => Promise<SubmitResult>;
  /** Receives step views and completions for funnel analytics. */
  tracker?: FormTracker;
}

/**
 * Renders a form as a working multi-step form, applying conditional logic as
 * the respondent answers: hidden fields aren't shown, validated or submitted,
 * and steps with nothing visible are skipped.
 */
export function FormRenderer({ form, className, onSubmit: submit, tracker }: FormRendererProps) {
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const stepEnteredAt = useRef(0);

  // The path follows routes and is recomputed as answers change, so later steps update live.
  const { path: steps, visible } = resolveFlow(form, answers);
  // Track the step by id: the list of active steps can change as answers change.
  const found = steps.findIndex((s) => s.id === currentStepId);
  const stepIndex = found === -1 ? 0 : found;
  const step = steps[stepIndex];
  const viewedStepId = done ? null : (step?.id ?? null);

  useEffect(() => {
    if (!viewedStepId) return;
    stepEnteredAt.current = now();
    tracker?.stepView(viewedStepId);
  }, [viewedStepId, tracker]);

  if (!step) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-input bg-white p-10 text-center", className)}>
        <p className="font-display text-xl text-foreground">Nothing to preview yet</p>
        <p className="mt-2 text-sm text-muted-foreground">Add a field in the editor and it will show up here.</p>
      </div>
    );
  }

  const fields = step.fields.filter((f) => visible.has(f.id));
  const isLast = stepIndex === steps.length - 1;
  const progress = done ? 1 : stepIndex / steps.length;

  function setAnswer(id: string, value: string) {
    setAnswers((a) => ({ ...a, [id]: value }));
    if (errors[id]) setErrors((e) => ({ ...e, [id]: "" }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const stepErrors: Record<string, string> = {};
    for (const field of fields) {
      const err = validateField(field, answers[field.id]);
      if (err) stepErrors[field.id] = err;
    }
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) {
      document.getElementById(`ff-${Object.keys(stepErrors)[0]}`)?.focus();
      return;
    }

    tracker?.stepComplete(step.id, msSince(stepEnteredAt.current));
    if (!isLast) {
      setCurrentStepId(steps[stepIndex + 1].id);
      return;
    }

    if (submit) {
      setSubmitting(true);
      setSubmitError(null);
      const onlyVisible = Object.fromEntries(Object.entries(answers).filter(([id]) => visible.has(id)));
      const result = await submit(onlyVisible).catch((): SubmitResult => ({ ok: false, error: "Couldn't reach the server. Check your connection and try again." }));
      setSubmitting(false);
      if (!result.ok) {
        setSubmitError(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
        return;
      }
    }
    setDone(true);
  }

  function restart() {
    setCurrentStepId(null);
    setAnswers({});
    setErrors({});
    setSubmitError(null);
    setDone(false);
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_2px_rgba(11,29,79,0.06),0_24px_48px_-24px_rgba(11,29,79,0.25)]", className)}>
      <div className="h-1 bg-secondary" aria-hidden>
        <m.div className="h-full bg-brand" initial={false} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.5, ease }} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <m.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center px-6 py-14 text-center sm:px-10"
          >
            <span className="grid size-12 place-items-center rounded-full bg-brand text-primary">
              <Check className="size-6" strokeWidth={3} />
            </span>
            <h2 className="mt-5 font-display text-2xl text-foreground">Thanks, that&apos;s everything.</h2>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              {submit ? "Your response was sent. You can close this page." : "In preview nothing is actually sent."}
            </p>
            {!submit && (
              <button type="button" onClick={restart} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                <RotateCcw className="size-3.5" /> Start again
              </button>
            )}
          </m.div>
        ) : (
          <m.form
            key={step.id}
            onSubmit={onSubmit}
            noValidate
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease }}
            className="p-6 sm:p-8"
          >
            <p className="text-xs font-medium text-muted-foreground">
              Step {stepIndex + 1} of {steps.length}
            </p>
            <h2 className="mt-1 font-display text-2xl text-foreground">{step.title || form.title}</h2>

            <div className="mt-6 space-y-5">
              {fields.map((field) => (
                // Fields revealed by an answer on this same step fade in.
                <m.div key={field.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease }}>
                  <FieldInput
                    field={field}
                    value={answers[field.id] ?? ""}
                    error={errors[field.id]}
                    onChange={(v) => setAnswer(field.id, v)}
                  />
                </m.div>
              ))}
            </div>

            {submitError && (
              <p role="alert" className="mt-6 rounded-lg bg-destructive/5 px-3 py-2.5 text-sm font-medium text-destructive">
                {submitError}
              </p>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStepId(steps[stepIndex - 1].id)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft className="size-4" /> Back
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {submitting ? "Sending…" : isLast ? "Submit" : "Next"}
                {!isLast && <ArrowRight className="size-4" />}
              </button>
            </div>
          </m.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: Field;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = `ff-${field.id}`;
  const describedBy = [field.helpText && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const common = { id, "aria-invalid": !!error, "aria-describedby": describedBy, "aria-required": field.required };
  const inputClass = "h-11 rounded-lg";

  let control: React.ReactNode;
  switch (field.type) {
    case "long_text":
      control = <Textarea {...common} rows={4} placeholder={field.placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg" />;
      break;
    case "dropdown":
      control = (
        <div className="relative">
          <select
            {...common}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "h-11 w-full appearance-none rounded-lg border border-input bg-white pl-3 pr-9 text-sm outline-none",
              "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 aria-invalid:border-destructive",
              value ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <option value="" disabled>
              {field.placeholder || "Select an option"}
            </option>
            {field.options.map((o, i) => (
              <option key={i} value={o}>
                {o}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      );
      break;
    case "multiple_choice":
      control = (
        <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={describedBy} aria-required={field.required} aria-invalid={!!error} className="grid gap-2 sm:grid-cols-2">
          {field.options.map((o, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={value === o}
              id={i === 0 ? id : undefined}
              onClick={() => onChange(o)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border border-input px-3 py-2.5 text-left text-sm font-medium transition-colors",
                "hover:border-primary/50 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                value === o && "border-primary bg-primary text-white hover:bg-primary",
              )}
            >
              <kbd
                className={cn(
                  "grid size-5 place-items-center rounded-[5px] border border-input bg-white text-[10px] font-semibold text-muted-foreground",
                  value === o && "border-transparent bg-brand text-primary",
                )}
              >
                {String.fromCharCode(65 + i)}
              </kbd>
              {o}
            </button>
          ))}
        </div>
      );
      break;
    case "rating":
      control = (
        <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={describedBy} aria-required={field.required} aria-invalid={!!error} className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === String(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              id={n === 1 ? id : undefined}
              onClick={() => onChange(String(n))}
              className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Star className={cn("size-7", Number(value) >= n ? "fill-brand text-brand" : "text-input")} />
            </button>
          ))}
        </div>
      );
      break;
    default: {
      const type = { email: "email", phone: "tel", number: "number", date: "date" }[field.type as string] ?? "text";
      control = (
        <Input
          {...common}
          type={type}
          inputMode={field.type === "phone" ? "tel" : field.type === "number" ? "decimal" : undefined}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
    }
  }

  const isGroup = field.type === "multiple_choice" || field.type === "rating";
  const LabelTag = isGroup ? "p" : "label";

  return (
    <div>
      {/* Option groups are named via aria-labelledby. A <label for> would wrongly rename their first option. */}
      <LabelTag
        id={`${id}-label`}
        {...(isGroup ? {} : { htmlFor: id })}
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {field.label || "Untitled question"}
        {field.required && <span className="ml-0.5 text-[#d6337f]" aria-hidden> *</span>}
      </LabelTag>
      {control}
      {field.helpText && (
        <p id={`${id}-help`} className="mt-1.5 text-xs text-muted-foreground">
          {field.helpText}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
