"use client";

import { AlertTriangle, GitBranch, Plus, X } from "lucide-react";
import { NativeSelect } from "@/components/ui/native-select";
import {
  conditionForSource,
  conditionProblem,
  defaultCondition,
  dependentsOf,
  earlierFields,
  OPERATOR_LABELS,
  operatorNeedsValue,
  operatorsFor,
  valuesFor,
  type ConditionProblem,
} from "@/lib/forms/logic";
import type { Condition, ConditionOperator, Field, Form } from "@/lib/forms/types";

const PROBLEM_TEXT: Record<ConditionProblem, string> = {
  "missing-source": "The question this rule used was deleted. Pick another one.",
  "source-after": "This rule points to a question that now comes after this one, so it's ignored. Move the question back above, or pick an earlier one.",
  "missing-value": "That answer no longer exists in the other question's options.",
};

export function LogicEditor({
  form,
  field,
  onChange,
}: {
  form: Form;
  field: Field;
  onChange: (condition: Condition | undefined) => void;
}) {
  const earlier = earlierFields(form, field.id);
  const condition = field.condition;
  const problem = conditionProblem(form, field);
  const dependents = dependentsOf(form, field.id);
  const stepOf = (id: string) => form.steps.findIndex((s) => s.fields.some((f) => f.id === id)) + 1;

  const source = condition ? form.steps.flatMap((s) => s.fields).find((f) => f.id === condition.fieldId) : undefined;
  const operators = source ? operatorsFor(source.type) : [];
  const values = source ? valuesFor(source) : [];

  return (
    <section aria-labelledby="logic-heading" className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between">
        <h3 id="logic-heading" className="flex items-center gap-2 text-sm font-medium text-foreground">
          <GitBranch className="size-4 text-primary" /> Logic
        </h3>
        {condition && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <X className="size-3.5" /> Remove rule
          </button>
        )}
      </div>

      {!condition ? (
        earlier.length === 0 ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Add a question before this one to show it only for certain answers.
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-muted-foreground">Always shown.</p>
            <button
              type="button"
              onClick={() => onChange(defaultCondition(form, field.id) ?? undefined)}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-primary hover:bg-secondary"
            >
              <Plus className="size-4" /> Show only if…
            </button>
          </>
        )
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">Show this question only if</p>

          <NativeSelect
            aria-label="Question this rule depends on"
            value={source ? condition.fieldId : ""}
            onChange={(e) => {
              const next = earlier.find((f) => f.id === e.target.value);
              if (next) onChange(conditionForSource(next));
            }}
          >
            {!source && <option value="">Pick a question…</option>}
            {/* Keep showing a source that has moved below, so the problem is visible rather than silently swapped. */}
            {source && !earlier.includes(source) && <option value={source.id}>{source.label || "Untitled question"} (below)</option>}
            {earlier.map((f) => (
              <option key={f.id} value={f.id}>
                Step {stepOf(f.id)} · {f.label || "Untitled question"}
              </option>
            ))}
          </NativeSelect>

          {source && (
            <div className="flex gap-2">
              <NativeSelect
                aria-label="Comparison"
                className={operatorNeedsValue(condition.operator) ? "w-28 shrink-0" : "flex-1"}
                value={condition.operator}
                onChange={(e) => {
                  const operator = e.target.value as ConditionOperator;
                  onChange({ ...condition, operator, value: operatorNeedsValue(operator) ? (condition.value || values[0] || "") : "" });
                }}
              >
                {operators.map((op) => (
                  <option key={op} value={op}>
                    {OPERATOR_LABELS[op]}
                  </option>
                ))}
              </NativeSelect>

              {operatorNeedsValue(condition.operator) && (
                <NativeSelect
                  aria-label="Answer"
                  className="min-w-0 flex-1"
                  value={values.includes(condition.value) ? condition.value : ""}
                  onChange={(e) => onChange({ ...condition, value: e.target.value })}
                >
                  {!values.includes(condition.value) && <option value="">Pick an answer…</option>}
                  {values.map((v) => (
                    <option key={v} value={v}>
                      {source.type === "rating" ? `${v} star${v === "1" ? "" : "s"}` : v}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </div>
          )}

          {problem && (
            <p role="alert" className="flex gap-2 rounded-lg bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-900">
              <AlertTriangle className="mt-px size-3.5 shrink-0" />
              {PROBLEM_TEXT[problem]}
            </p>
          )}
        </div>
      )}

      {dependents.length > 0 && (
        <p className="mt-3 border-t border-border pt-2.5 text-xs leading-relaxed text-muted-foreground">
          {dependents.length === 1 ? "1 question depends" : `${dependents.length} questions depend`} on this answer:{" "}
          {dependents.map((d) => `“${d.label || "Untitled"}”`).join(", ")}.
        </p>
      )}
    </section>
  );
}
