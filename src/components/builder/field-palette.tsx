"use client";

import { useDraggable } from "@dnd-kit/core";
import { FIELD_GROUPS, FIELD_TYPES, fieldTypesIn } from "@/lib/forms/field-types";
import type { FieldType } from "@/lib/forms/types";
import { cn } from "@/lib/utils";

export const paletteId = (type: FieldType) => `palette:${type}`;

function PaletteItem({ type, onAdd, compact }: { type: FieldType; onAdd: (t: FieldType) => void; compact?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: paletteId(type),
    data: { from: "palette", type },
  });
  const meta = FIELD_TYPES[type];
  const Icon = meta.icon;

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={() => onAdd(type)}
      aria-label={`Add ${meta.label} field`}
      className={cn(
        "flex shrink-0 cursor-grab items-center gap-2.5 rounded-lg border border-border bg-white text-left text-sm text-foreground transition-[border-color,box-shadow] active:cursor-grabbing",
        "hover:border-primary/40 hover:shadow-[0_4px_12px_-6px_rgba(9,49,141,0.35)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
        compact ? "px-3 py-2" : "w-full px-2.5 py-2",
        isDragging && "opacity-50",
      )}
    >
      <span className="grid size-6 place-items-center rounded-md bg-secondary text-primary">
        <Icon className="size-3.5" />
      </span>
      {meta.label}
    </button>
  );
}

/** Vertical palette for the desktop sidebar. */
export function FieldPalette({ onAdd }: { onAdd: (t: FieldType) => void }) {
  return (
    <div className="space-y-5 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Add a field</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Drag onto a step, or click to add.</p>
      </div>
      {FIELD_GROUPS.map((group) => (
        <div key={group}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
          <div className="space-y-1.5">
            {fieldTypesIn(group).map((t) => (
              <PaletteItem key={t} type={t} onAdd={onAdd} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Horizontal strip used on small screens. Click-to-add only, so it doesn't fight with scrolling. */
export function FieldStrip({ onAdd }: { onAdd: (t: FieldType) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
      {(Object.keys(FIELD_TYPES) as FieldType[]).map((t) => {
        const meta = FIELD_TYPES[t];
        const Icon = meta.icon;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onAdd(t)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm text-foreground"
          >
            <Icon className="size-3.5 text-primary" /> {meta.label}
          </button>
        );
      })}
    </div>
  );
}

export function PaletteOverlay({ type }: { type: FieldType }) {
  const meta = FIELD_TYPES[type];
  const Icon = meta.icon;
  return (
    <div className="flex w-56 cursor-grabbing items-center gap-2.5 rounded-lg border border-primary/40 bg-white px-2.5 py-2 text-sm text-foreground shadow-[0_16px_32px_-12px_rgba(9,49,141,0.45)]">
      <span className="grid size-6 place-items-center rounded-md bg-secondary text-primary">
        <Icon className="size-3.5" />
      </span>
      {meta.label}
    </div>
  );
}
