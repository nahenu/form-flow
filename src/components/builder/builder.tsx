"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type Active,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Over,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { FormRenderer } from "@/components/forms/form-renderer";
import * as ops from "@/lib/forms/operations";
import { useCanUndoRedo, useFormsStore, useHydrated } from "@/lib/forms/store";
import type { Field, FieldType, Form } from "@/lib/forms/types";
import { cn } from "@/lib/utils";
import { BuilderHeader, type BuilderMode } from "./builder-header";
import { Canvas, FieldOverlay } from "./canvas";
import { FieldPalette, FieldStrip, PaletteOverlay } from "./field-palette";
import { Inspector } from "./inspector";

type DragData = { from: "palette"; type: FieldType } | { from: "canvas"; stepId: string };

/** Fields and drop zones never overlap, so whatever is under the pointer wins; keyboard drags fall back to closest center. */
const collisionDetection: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  return within.length ? [within[0]] : closestCenter(args);
};

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

export function Builder({ formId }: { formId: string }) {
  const hydrated = useHydrated();
  const form = useFormsStore((s) => s.forms[formId]);

  if (!hydrated) return <BuilderSkeleton />;
  if (!form) return <FormNotFound />;
  return <BuilderLoaded form={form} />;
}

function BuilderLoaded({ form }: { form: Form }) {
  const formId = form.id;
  const edit = useFormsStore((s) => s.edit);
  const undo = useFormsStore((s) => s.undo);
  const redo = useFormsStore((s) => s.redo);
  const { canUndo, canRedo } = useCanUndoRedo(formId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<BuilderMode>("edit");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [active, setActive] = useState<{ id: string; data: DragData } | null>(null);
  const [overStepId, setOverStepId] = useState<string | null>(null);
  // Next keeps the previous route mounted (hidden), so never query `main` globally.
  const canvasRef = useRef<HTMLElement>(null);

  const selected = selectedId ? (ops.findField(form, selectedId)?.field ?? null) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ---- actions -----------------------------------------------------------

  function focusField(id: string | null) {
    setSelectedId(id);
    if (id) {
      requestAnimationFrame(() =>
        document.getElementById(`field-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
      );
    }
  }

  function addField(type: FieldType, stepId?: string, index?: number) {
    const targetStep =
      stepId ?? (selectedId ? ops.findField(form, selectedId)?.step.id : undefined) ?? form.steps[form.steps.length - 1].id;
    let newId: string | null = null;
    edit(formId, (d) => {
      newId = ops.addField(d, targetStep, type, index);
    });
    if (mode === "preview") setMode("edit");
    focusField(newId);
  }

  function removeField(id: string) {
    let rulesCleared = 0;
    edit(formId, (d) => {
      rulesCleared = ops.removeField(d, id);
    });
    if (selectedId === id) setSelectedId(null);
    if (rulesCleared > 0) {
      toast(`Field deleted, along with ${rulesCleared === 1 ? "1 rule that used it" : `${rulesCleared} rules that used it`}`, {
        action: { label: "Undo", onClick: () => undo(formId) },
      });
    }
  }

  function duplicateField(id: string) {
    let copyId: string | null = null;
    edit(formId, (d) => {
      copyId = ops.duplicateField(d, id);
    });
    focusField(copyId);
  }

  function updateSelected(patch: Partial<Omit<Field, "id">>, coalesceKey: string) {
    if (selectedId) edit(formId, (d) => ops.updateField(d, selectedId, patch), coalesceKey);
  }

  function removeStep(stepId: string) {
    const step = form.steps.find((s) => s.id === stepId);
    let rulesCleared = 0;
    edit(formId, (d) => {
      rulesCleared = ops.removeStep(d, stepId);
    });
    if (selectedId && step?.fields.some((f) => f.id === selectedId)) setSelectedId(null);
    const extra = rulesCleared ? ` and ${rulesCleared === 1 ? "1 rule" : `${rulesCleared} rules`} that used it` : "";
    toast(`Deleted "${step?.title || "step"}"${extra}`, { action: { label: "Undo", onClick: () => undo(formId) } });
  }

  // ---- keyboard shortcuts ------------------------------------------------

  // The listener is registered once per dependency change; read the latest removeField through a ref.
  const removeFieldRef = useRef(removeField);
  useEffect(() => {
    removeFieldRef.current = removeField;
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const typing = isTypingTarget(e.target);
      const key = e.key.toLowerCase();
      if (mod && key === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) redo(formId);
        else undo(formId);
      } else if (mod && key === "y" && !typing) {
        e.preventDefault();
        redo(formId);
      } else if ((e.key === "Delete" || e.key === "Backspace") && !typing && selectedId && mode === "edit") {
        e.preventDefault();
        removeFieldRef.current(selectedId);
      } else if (e.key === "Escape" && !active) {
        setSelectedId(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [formId, selectedId, mode, active, edit, undo, redo]);

  // ---- drag and drop -----------------------------------------------------

  function resolveTarget(over: Over | null): { stepId: string; index: number } | null {
    if (!over) return null;
    const data = over.data.current as { sortable?: { containerId: string; index: number }; kind?: string; stepId?: string } | undefined;
    if (data?.sortable) return { stepId: String(data.sortable.containerId), index: data.sortable.index };
    if (data?.kind === "step" && data.stepId) {
      const step = form.steps.find((s) => s.id === data.stepId);
      return step ? { stepId: step.id, index: step.fields.length } : null;
    }
    return null;
  }

  function onDragStart({ active }: DragStartEvent) {
    setActive({ id: String(active.id), data: active.data.current as DragData });
  }

  function onDragOver({ over }: DragOverEvent) {
    setOverStepId(resolveTarget(over)?.stepId ?? null);
  }

  function onDragEnd({ active: dragged, over }: DragEndEvent) {
    const target = resolveTarget(over);
    const data = dragged.data.current as DragData | undefined;
    setActive(null);
    setOverStepId(null);
    if (!target || !data) return;

    if (data.from === "palette") {
      addField(data.type, target.stepId, target.index);
      return;
    }

    const fieldId = String(dragged.id);
    const currentIndex = sortableIndex(dragged);
    if (data.stepId === target.stepId && currentIndex === target.index) return;
    edit(formId, (d) => ops.moveField(d, fieldId, target.stepId, target.index));
  }

  function onDragCancel() {
    setActive(null);
    setOverStepId(null);
  }

  const activeField = active?.data.from === "canvas" ? ops.findField(form, active.id)?.field : null;

  // ---- render --------------------------------------------------------------

  return (
    <TooltipProvider delayDuration={300}>
      <Toaster position="bottom-center" />
      <div className="flex h-dvh flex-col bg-muted/50">
        <BuilderHeader
          title={form.title}
          updatedAt={form.updatedAt}
          mode={mode}
          canUndo={canUndo}
          canRedo={canRedo}
          onTitleChange={(title) => edit(formId, (d) => void (d.title = title), "title")}
          onModeChange={(m) => {
            setMode(m);
            if (m === "preview") setSelectedId(null);
          }}
          onUndo={() => undo(formId)}
          onRedo={() => redo(formId)}
        />

        {mode === "preview" ? (
          <main className="flex-1 overflow-y-auto" aria-label="Form preview">
            <div className="sticky top-0 z-10 flex justify-center border-b border-border bg-white/80 py-2 backdrop-blur-sm">
              <div role="tablist" aria-label="Preview size" className="flex rounded-lg bg-secondary p-0.5 text-sm">
                {(
                  [
                    ["desktop", "Desktop", Monitor],
                    ["mobile", "Mobile", Smartphone],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={device === value}
                    onClick={() => setDevice(value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium",
                      device === value ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" /> {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-10">
              <FormRenderer
                form={form}
                className={cn("mx-auto transition-[max-width] duration-300", device === "mobile" ? "max-w-[390px]" : "max-w-xl")}
              />
            </div>
          </main>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
            accessibility={{
              screenReaderInstructions: {
                draggable: "To pick up a field, press space or enter. Use the arrow keys to move it, space or enter to drop it, or escape to cancel.",
              },
            }}
          >
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)_20rem]">
              <aside aria-label="Field types" className="hidden overflow-y-auto border-r border-border bg-white lg:block">
                <FieldPalette onAdd={(t) => addField(t)} />
              </aside>

              <div className="flex min-h-0 min-w-0 flex-col">
                <div className="border-b border-border bg-white lg:hidden">
                  <FieldStrip onAdd={(t) => addField(t)} />
                </div>
                <main
                  ref={canvasRef}
                  className="flex-1 overflow-y-auto bg-[radial-gradient(#d5ddef_1px,transparent_1px)] [background-size:18px_18px]"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setSelectedId(null);
                  }}
                >
                  <Canvas
                    form={form}
                    selectedId={selectedId}
                    isDragging={!!active}
                    overStepId={overStepId}
                    onSelect={focusField}
                    onDuplicate={duplicateField}
                    onRemove={removeField}
                    onRenameStep={(stepId, title) => edit(formId, (d) => ops.renameStep(d, stepId, title), `step-title:${stepId}`)}
                    onRemoveStep={removeStep}
                    onAddStep={() => {
                      edit(formId, (d) => void ops.addStep(d));
                      requestAnimationFrame(() => {
                        const el = canvasRef.current;
                        el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
                      });
                    }}
                    onQuickAdd={(stepId) => addField("short_text", stepId)}
                  />
                </main>
              </div>

              <aside
                aria-label="Field settings"
                className={cn(
                  "border-l border-border bg-white",
                  "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-30 max-lg:max-h-[70dvh] max-lg:rounded-t-2xl max-lg:border-t max-lg:shadow-[0_-20px_40px_-20px_rgba(9,49,141,0.35)]",
                  !selected && "max-lg:hidden",
                  "lg:overflow-y-auto",
                )}
              >
                <Inspector
                  form={form}
                  field={selected}
                  onChange={updateSelected}
                  onDuplicate={() => selected && duplicateField(selected.id)}
                  onRemove={() => selected && removeField(selected.id)}
                  onClose={() => setSelectedId(null)}
                />
              </aside>
            </div>

            <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
              {active?.data.from === "palette" ? (
                <PaletteOverlay type={active.data.type} />
              ) : activeField ? (
                <FieldOverlay field={activeField} />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </TooltipProvider>
  );
}

function sortableIndex(active: Active) {
  return (active.data.current as { sortable?: { index: number } } | undefined)?.sortable?.index ?? -1;
}

function BuilderSkeleton() {
  return (
    <div className="flex h-dvh flex-col bg-muted/50" aria-busy="true" aria-label="Loading builder">
      <div className="h-14 border-b border-border bg-white" />
      <div className="grid flex-1 lg:grid-cols-[15rem_1fr_20rem]">
        <div className="hidden border-r border-border bg-white lg:block" />
        <div className="mx-auto w-full max-w-2xl space-y-3 px-6 py-8">
          <div className="h-48 animate-pulse rounded-2xl bg-white" />
          <div className="h-48 animate-pulse rounded-2xl bg-white" />
        </div>
        <div className="hidden border-l border-border bg-white lg:block" />
      </div>
    </div>
  );
}

function FormNotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-muted/50 px-5 text-center">
      <div>
        <h1 className="font-display text-3xl text-foreground">Form not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been deleted, or it was created in another browser.</p>
        <Link href="/dashboard" className="mt-6 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white">
          Back to your forms
        </Link>
      </div>
    </div>
  );
}
