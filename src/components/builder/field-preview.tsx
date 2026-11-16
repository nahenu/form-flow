import { CalendarDays, ChevronDown, Star } from "lucide-react";
import { FIELD_TYPES } from "@/lib/forms/field-types";
import type { Field } from "@/lib/forms/types";
import { cn } from "@/lib/utils";

/** Read-only rendering of a field as it appears on the canvas. */
export function FieldPreview({ field }: { field: Field }) {
  const meta = FIELD_TYPES[field.type];
  const Icon = meta.icon;
  const box = "mt-2.5 flex h-9 items-center rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground/80";

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5 text-primary/70" />
        {meta.label}
        {field.required && (
          <span className="rounded-full bg-brand-soft px-1.5 py-px text-[10px] font-semibold text-[#b8326f]">Required</span>
        )}
      </div>
      <p className={cn("mt-1.5 truncate font-medium text-foreground", !field.label && "text-muted-foreground italic")}>
        {field.label || "Untitled question"}
      </p>

      {(field.type === "short_text" || field.type === "email" || field.type === "phone" || field.type === "number") && (
        <div className={box}>
          <span className="truncate">{field.placeholder || " "}</span>
        </div>
      )}
      {field.type === "long_text" && (
        <div className={cn(box, "h-16 items-start pt-2")}>
          <span className="truncate">{field.placeholder || " "}</span>
        </div>
      )}
      {field.type === "dropdown" && (
        <div className={cn(box, "justify-between")}>
          <span className="truncate">{field.placeholder || "Select an option"}</span>
          <ChevronDown className="size-4 shrink-0" />
        </div>
      )}
      {field.type === "date" && (
        <div className={cn(box, "justify-between")}>
          dd / mm / yyyy
          <CalendarDays className="size-4" />
        </div>
      )}
      {field.type === "multiple_choice" && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {field.options.slice(0, 6).map((o, i) => (
            <span key={i} className="max-w-full truncate rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs text-foreground/80">
              {o || `Option ${i + 1}`}
            </span>
          ))}
          {field.options.length > 6 && <span className="px-1 py-1 text-xs text-muted-foreground">+{field.options.length - 6} more</span>}
        </div>
      )}
      {field.type === "rating" && (
        <div className="mt-2.5 flex gap-1 text-input">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="size-5" />
          ))}
        </div>
      )}
      {field.helpText && <p className="mt-1.5 truncate text-xs text-muted-foreground">{field.helpText}</p>}
    </div>
  );
}
