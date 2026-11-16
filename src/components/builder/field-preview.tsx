import { AlertTriangle, CalendarDays, ChevronDown, GitBranch, Star } from "lucide-react";
import { FIELD_TYPES } from "@/lib/forms/field-types";
import type { Field } from "@/lib/forms/types";
import { cn } from "@/lib/utils";

export interface LogicBadge {
  text: string;
  broken: boolean;
}

/**
 * Read-only rendering of a field on the canvas. Rendered inside a <button>, so
 * it uses spans only (buttons may contain phrasing content only). The question
 * comes first in the DOM, so screen readers announce it first; flex `order`
 * keeps the type row visually on top.
 */
export function FieldPreview({ field, logic }: { field: Field; logic?: LogicBadge }) {
  const meta = FIELD_TYPES[field.type];
  const Icon = meta.icon;
  const box = "mt-2.5 flex h-9 items-center rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground";

  return (
    <span className="flex min-w-0 flex-col">
      <span data-field-label className={cn("order-3 mt-1.5 block truncate font-medium text-foreground", !field.label && "text-muted-foreground italic")}>
        {field.label || "Untitled question"}
      </span>

      <span className="order-1 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5 text-primary/70" aria-hidden />
        {meta.label}
        {field.required && (
          <span className="rounded-full bg-brand-soft px-1.5 py-px text-[10px] font-semibold text-[#9d2860]">Required</span>
        )}
      </span>

      {logic && (
        <span
          className={cn(
            "order-2 mt-2 inline-flex max-w-full items-center gap-1.5 self-start rounded-md px-2 py-1 text-xs",
            logic.broken ? "bg-amber-50 text-amber-900" : "bg-secondary text-primary",
          )}
        >
          {logic.broken ? <AlertTriangle className="size-3.5 shrink-0" aria-hidden /> : <GitBranch className="size-3.5 shrink-0" aria-hidden />}
          <span className="truncate">
            {logic.broken ? "Rule needs fixing: " : "Shows if "}
            {logic.text}
          </span>
        </span>
      )}

      <span className="order-4 flex flex-col">
        {(field.type === "short_text" || field.type === "email" || field.type === "phone" || field.type === "number") && (
          <span className={box}>
            <span className="truncate">{field.placeholder || " "}</span>
          </span>
        )}
        {field.type === "long_text" && (
          <span className={cn(box, "h-16 items-start pt-2")}>
            <span className="truncate">{field.placeholder || " "}</span>
          </span>
        )}
        {field.type === "dropdown" && (
          <span className={cn(box, "justify-between")}>
            <span className="truncate">{field.placeholder || "Select an option"}</span>
            <ChevronDown className="size-4 shrink-0" aria-hidden />
          </span>
        )}
        {field.type === "date" && (
          <span className={cn(box, "justify-between")}>
            dd / mm / yyyy
            <CalendarDays className="size-4" aria-hidden />
          </span>
        )}
        {field.type === "multiple_choice" && (
          <span className="mt-2.5 flex flex-wrap gap-1.5">
            {field.options.slice(0, 6).map((o, i) => (
              <span key={i} className="max-w-full truncate rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs text-foreground">
                {o || `Option ${i + 1}`}
              </span>
            ))}
            {field.options.length > 6 && <span className="px-1 py-1 text-xs text-muted-foreground">+{field.options.length - 6} more</span>}
          </span>
        )}
        {field.type === "rating" && (
          <span className="mt-2.5 flex gap-1 text-input">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="size-5" aria-hidden />
            ))}
          </span>
        )}
        {field.helpText && <span className="mt-1.5 block truncate text-xs text-muted-foreground">{field.helpText}</span>}
      </span>
    </span>
  );
}
