"use client";

import { Copy, Keyboard, Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FIELD_TYPES } from "@/lib/forms/field-types";
import { countFields } from "@/lib/forms/operations";
import type { Field, Form } from "@/lib/forms/types";

const labelClass = "mb-1.5 block text-xs font-semibold text-foreground";

interface InspectorProps {
  form: Form;
  field: Field | null;
  onChange: (patch: Partial<Omit<Field, "id">>, coalesceKey: string) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onClose: () => void;
}

export function Inspector({ form, field, onChange, onDuplicate, onRemove, onClose }: InspectorProps) {
  if (!field) return <FormSummary form={form} />;

  const meta = FIELD_TYPES[field.type];
  const Icon = meta.icon;
  const key = (prop: string) => `${field.id}:${prop}`;

  function setOption(i: number, value: string) {
    const options = [...field!.options];
    options[i] = value;
    onChange({ options }, key(`option-${i}`));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-secondary text-primary">
            <Icon className="size-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">{meta.label}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close field settings"
          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <div>
          <label htmlFor="insp-label" className={labelClass}>
            Question
          </label>
          <Input
            id="insp-label"
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value }, key("label"))}
            placeholder="What do you want to ask?"
          />
        </div>

        {meta.hasPlaceholder && (
          <div>
            <label htmlFor="insp-placeholder" className={labelClass}>
              Placeholder
            </label>
            <Input
              id="insp-placeholder"
              value={field.placeholder}
              onChange={(e) => onChange({ placeholder: e.target.value }, key("placeholder"))}
            />
          </div>
        )}

        <div>
          <label htmlFor="insp-help" className={labelClass}>
            Help text <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            id="insp-help"
            rows={2}
            value={field.helpText}
            onChange={(e) => onChange({ helpText: e.target.value }, key("help"))}
            placeholder="Shown under the field"
          />
        </div>

        {meta.hasOptions && (
          <fieldset>
            <legend className={labelClass}>Options</legend>
            <ul className="space-y-2">
              {field.options.map((option, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center font-mono text-[11px] text-muted-foreground">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <Input
                    value={option}
                    aria-label={`Option ${i + 1}`}
                    onChange={(e) => setOption(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && i === field.options.length - 1) {
                        e.preventDefault();
                        onChange({ options: [...field.options, ""] }, key("add-option"));
                        requestAnimationFrame(() =>
                          document.querySelector<HTMLInputElement>(`[aria-label="Option ${i + 2}"]`)?.focus(),
                        );
                      }
                    }}
                    className="h-9"
                  />
                  <button
                    type="button"
                    disabled={field.options.length <= 1}
                    onClick={() => onChange({ options: field.options.filter((_, j) => j !== i) }, key(`remove-${i}-${Date.now()}`))}
                    aria-label={`Remove option ${i + 1}`}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-30"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => onChange({ options: [...field.options, `Option ${field.options.length + 1}`] }, key(`add-${Date.now()}`))}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-primary hover:bg-secondary"
            >
              <Plus className="size-4" /> Add option
            </button>
          </fieldset>
        )}

        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <label htmlFor="insp-required" className="text-sm font-medium text-foreground">
              Required
            </label>
            <p className="text-xs text-muted-foreground">People can&apos;t continue without answering.</p>
          </div>
          <Switch
            id="insp-required"
            checked={field.required}
            onCheckedChange={(required) => onChange({ required }, key(`required-${Date.now()}`))}
          />
        </div>
      </div>

      <div className="flex gap-2 border-t border-border p-4">
        <button
          type="button"
          onClick={onDuplicate}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted"
        >
          <Copy className="size-4" /> Duplicate
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium text-destructive hover:bg-destructive/5"
        >
          <Trash2 className="size-4" /> Delete
        </button>
      </div>
    </div>
  );
}

function FormSummary({ form }: { form: Form }) {
  const fields = countFields(form);
  const required = form.steps.reduce((n, s) => n + s.fields.filter((f) => f.required).length, 0);
  const stats = [
    ["Steps", form.steps.length],
    ["Fields", fields],
    ["Required", required],
  ] as const;

  return (
    <div className="space-y-6 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Form overview</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Select a field on the canvas to edit it.</p>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border p-3">
            <dt className="text-[11px] text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 font-display text-2xl text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="rounded-xl bg-muted/70 p-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Keyboard className="size-4 text-primary" /> Shortcuts
        </p>
        <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
          {[
            ["Undo", "Ctrl Z"],
            ["Redo", "Ctrl Shift Z"],
            ["Delete selected field", "Del"],
            ["Deselect", "Esc"],
            ["Move a field (on its handle)", "Space, then ↑ ↓"],
          ].map(([action, keys]) => (
            <li key={action} className="flex items-center justify-between gap-3">
              {action}
              <kbd className="rounded border border-border bg-white px-1.5 py-0.5 font-mono text-[10px] text-foreground">{keys}</kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
