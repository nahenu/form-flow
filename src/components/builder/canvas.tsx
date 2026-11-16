"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { conditionProblem, describeCondition } from "@/lib/forms/logic";
import type { Field, Form, Step } from "@/lib/forms/types";
import { cn } from "@/lib/utils";
import { FieldPreview, type LogicBadge } from "./field-preview";

export const stepZoneId = (stepId: string) => `step:${stepId}`;

interface CanvasProps {
  form: Form;
  selectedId: string | null;
  isDragging: boolean;
  overStepId: string | null;
  onSelect: (id: string | null) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onRenameStep: (stepId: string, title: string) => void;
  onRemoveStep: (stepId: string) => void;
  onAddStep: () => void;
  onQuickAdd: (stepId: string) => void;
}

export function Canvas(props: CanvasProps) {
  const { form } = props;
  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 px-4 py-8 sm:px-6">
      {form.steps.map((step, i) => (
        <div key={step.id}>
          {i > 0 && <div aria-hidden className="mx-auto mb-3 h-5 w-px bg-input" />}
          <StepCard step={step} index={i} canRemove={form.steps.length > 1} {...props} />
        </div>
      ))}
      <button
        type="button"
        onClick={props.onAddStep}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-input py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-white hover:text-primary"
      >
        <Plus className="size-4" /> Add step
      </button>
    </div>
  );
}

function logicBadge(form: Form, field: Field): LogicBadge | undefined {
  if (!field.condition) return undefined;
  return { text: describeCondition(form, field.condition), broken: conditionProblem(form, field) !== null };
}

function StepCard({
  form,
  step,
  index,
  canRemove,
  selectedId,
  isDragging,
  overStepId,
  onSelect,
  onDuplicate,
  onRemove,
  onRenameStep,
  onRemoveStep,
  onQuickAdd,
}: CanvasProps & { step: Step; index: number; canRemove: boolean }) {
  return (
    <section
      aria-label={`Step ${index + 1}: ${step.title}`}
      className={cn(
        "rounded-2xl border border-border bg-white/70 p-3 transition-shadow sm:p-4",
        overStepId === step.id && "ring-2 ring-brand/60",
      )}
    >
      <header className="flex items-center gap-2 px-1 pb-3">
        <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-white">Step {index + 1}</span>
        <input
          value={step.title}
          onChange={(e) => onRenameStep(step.id, e.target.value)}
          aria-label={`Step ${index + 1} title`}
          placeholder="Step title"
          className="min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-0.5 font-display text-lg text-foreground outline-none hover:bg-muted focus:bg-muted"
        />
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
          {step.fields.length} {step.fields.length === 1 ? "field" : "fields"}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemoveStep(step.id)}
            aria-label={`Delete step ${index + 1}`}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </header>

      <SortableContext id={step.id} items={step.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2.5">
          {step.fields.map((field) => (
            <SortableField
              key={field.id}
              field={field}
              logic={logicBadge(form, field)}
              stepId={step.id}
              selected={selectedId === field.id}
              onSelect={() => onSelect(field.id)}
              onDuplicate={() => onDuplicate(field.id)}
              onRemove={() => onRemove(field.id)}
            />
          ))}
        </ul>
      </SortableContext>

      <StepDropZone stepId={step.id} isDragging={isDragging} empty={step.fields.length === 0} onQuickAdd={() => onQuickAdd(step.id)} />
    </section>
  );
}

function StepDropZone({
  stepId,
  isDragging,
  empty,
  onQuickAdd,
}: {
  stepId: string;
  isDragging: boolean;
  empty: boolean;
  onQuickAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stepZoneId(stepId), data: { kind: "step", stepId } });

  return (
    <div ref={setNodeRef} className={cn(!empty && "mt-2.5")}>
      {isDragging ? (
        <div
          className={cn(
            "grid place-items-center rounded-xl border-2 border-dashed text-sm transition-colors",
            empty ? "h-24" : "h-14",
            isOver ? "border-brand bg-brand-soft text-[#b8326f]" : "border-input text-muted-foreground",
          )}
        >
          Drop here
        </div>
      ) : (
        <button
          type="button"
          onClick={onQuickAdd}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-xl text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary",
            empty ? "h-24 border-2 border-dashed border-input" : "h-9",
          )}
        >
          <Plus className="size-4" />
          {empty ? "Drag a field here, or click to add a short text field" : "Add field"}
        </button>
      )}
    </div>
  );
}

function SortableField({
  field,
  logic,
  stepId,
  selected,
  onSelect,
  onDuplicate,
  onRemove,
}: {
  field: Field;
  logic?: LogicBadge;
  stepId: string;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver, active } = useSortable({
    id: field.id,
    data: { from: "canvas", stepId },
  });

  // Inserting from the palette or another step: show where it will land.
  const incoming = isOver && active && (active.data.current?.from === "palette" || active.data.current?.stepId !== stepId);

  return (
    <li
      ref={setNodeRef}
      id={`field-${field.id}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10 opacity-40")}
    >
      {incoming && <span aria-hidden className="absolute -top-[7px] inset-x-3 h-0.5 rounded-full bg-brand" />}
      {/* A plain container with sibling controls: no buttons nested inside a button. */}
      <div
        className={cn(
          "group flex gap-2 rounded-xl border bg-white p-3 pr-2 transition-[border-color,box-shadow] sm:p-4 sm:pr-3",
          selected
            ? "border-primary shadow-[0_0_0_3px_rgba(9,49,141,0.12)]"
            : "border-border hover:border-primary/30 has-[button:focus-visible]:border-primary",
        )}
      >
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${field.label || "field"}`}
          className="-ml-1 grid w-6 shrink-0 cursor-grab touch-none place-items-center self-stretch rounded-md text-muted-foreground/60 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        {/* Named by its own visible content (WCAG label-in-name): "Edit field: Full name, Short text, …". */}
        <button type="button" aria-pressed={selected} onClick={onSelect} className="min-w-0 flex-1 rounded-md text-left outline-none">
          <span className="sr-only">Edit field: </span>
          <FieldPreview field={field} logic={logic} />
        </button>
        <div className="flex shrink-0 flex-col gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            aria-label="Duplicate field"
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Delete field"
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </li>
  );
}

export function FieldOverlay({ field }: { field: Field }) {
  return (
    <div className="flex w-full max-w-xl cursor-grabbing gap-2 rounded-xl border border-primary bg-white p-4 shadow-[0_20px_40px_-16px_rgba(9,49,141,0.5)]">
      <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <FieldPreview field={field} />
      </div>
    </div>
  );
}
