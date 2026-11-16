"use client";

import { useEffect, useMemo, useRef } from "react";
import { submitResponse } from "@/app/actions/responses";
import { FormRenderer, type FormTracker, type SubmitResult } from "@/components/forms/form-renderer";
import type { PublishedForm } from "@/lib/forms/public";
import { createTracker, type Tracker } from "@/lib/tracking";

/** A published form as respondents see it: tracked, submitting for real, optionally inside an embed iframe. */
export function PublicForm({ form, embedded }: { form: PublishedForm; embedded: boolean }) {
  const trackerRef = useRef<Tracker | null>(null);
  const startedAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const container = useRef<HTMLDivElement>(null);

  // Created lazily: the renderer's first step_view fires from a child effect, before this component's own effects run.
  const stepTracker = useMemo<FormTracker>(() => {
    const ensure = () => (trackerRef.current ??= createTracker(form.id));
    return {
      stepView: (stepId) => ensure().stepView(stepId),
      stepComplete: (stepId, ms) => ensure().stepComplete(stepId, ms),
    };
  }, [form.id]);

  useEffect(() => {
    const tracker = (trackerRef.current ??= createTracker(form.id));
    tracker.view();
    startedAt.current = performance.now();
    return () => {
      tracker.dispose();
      trackerRef.current = null;
    };
  }, [form.id]);

  // Inside an embed, tell the host page how tall we are so its iframe can fit the form exactly.
  useEffect(() => {
    if (!embedded || !container.current || window.parent === window) return;
    const el = container.current;
    // Measure the form itself: the document is at least as tall as the iframe, so it could only ever grow.
    const post = () =>
      window.parent.postMessage({ type: "formflow:height", formId: form.id, height: Math.ceil(el.getBoundingClientRect().height) + 8 }, "*");
    const observer = new ResizeObserver(post);
    observer.observe(el);
    post();
    return () => observer.disconnect();
  }, [embedded, form.id]);

  async function onSubmit(answers: Record<string, string>): Promise<SubmitResult> {
    const tracker = trackerRef.current;
    tracker?.flush();
    return submitResponse({
      formId: form.id,
      visitorId: tracker?.visitorId ?? crypto.randomUUID(),
      answers,
      source: tracker?.source,
      durationMs: Math.round(performance.now() - startedAt.current),
      website: honeypot.current?.value || undefined,
    });
  }

  return (
    <div ref={container}>
      {/* Honeypot for bots: hidden from people and from assistive tech. */}
      <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <FormRenderer form={form} onSubmit={onSubmit} tracker={stepTracker} className={embedded ? "shadow-none" : undefined} />
    </div>
  );
}
