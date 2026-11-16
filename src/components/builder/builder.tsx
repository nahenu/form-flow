"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { publishForm, saveForm, unpublishForm } from "@/app/actions/forms";
import { toDefinition } from "@/lib/forms/definition";
import { stableStringify } from "@/lib/stable-json";
import * as ops from "@/lib/forms/operations";
import { useCanUndoRedo, useFormsStore } from "@/lib/forms/store";
import type { Field, FieldType, Form } from "@/lib/forms/types";
import { cn } from "@/lib/utils";
import { BuilderHeader, type BuilderMode, type PublishState } from "./builder-header";
import { ShareDialog } from "./share-dialog";
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

/** Loads the server copy into the editing store for as long as the builder is open. */
export function Builder({ initial, published }: { initial: Form; published: string | null }) {
  const stored = useFormsStore((s) => s.forms[initial.id]);
  const initialRef = useRef(initial);
  const [publishedSnapshot] = useState(published);

  useEffect(() => {
    const { load, unload } = useFormsStore.getState();
    const form = initialRef.current;
    load(form);
    return () => unload(form.id);
  }, []);

  return <BuilderLoaded form={stored ?? initial} initialPublished={publishedSnapshot} />;
}

/** Publish state compares the editor's version with the live snapshot (key-order independent). */
function usePublishing(form: Form, initialPublished: string | null) {
  const [published, setPublished] = useState(initialPublished);
  const [publishing, setPublishing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const current = useMemo(() => stableStringify(toDefinition(form)), [form]);
  const state: PublishState = published === null ? "draft" : published === current ? "live" : "changed";

  async function publish() {
    setPublishing(true);
    const result = await publishForm(form.id, toDefinition(form)).catch(() => null);
    setPublishing(false);
    if (!result?.ok) {
      toast.error(result?.error ?? "Couldn't publish. Try again.");
      return;
    }
    const wasDraft = published === null;
    setPublished(current);
    if (wasDraft) setShareOpen(true);
    else toast.success("Changes are live");
  }

  async function unpublish() {
    const result = await unpublishForm(form.id).catch(() => null);
    if (!result?.ok) {
      toast.error("Couldn't unpublish. Try again.");
      return;
    }
    setPublished(null);
    setShareOpen(false);
    toast("Form unpublished. The link no longer works.");
  }

  return { state, publishing, publish, unpublish, shareOpen, setShareOpen };
}

export type SaveStatus = "saved" | "saving" | "error";

/**
 * Debounced autosave. Saves run one at a time, in order, so a slow request can
 * never overwrite a newer one.
 */
function useAutosave(form: Form): { status: SaveStatus; retry: () => void } {
  const snapshot = useMemo(() => JSON.stringify(toDefinition(form)), [form]);
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const dirty = snapshot !== savedSnapshot;

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      queue.current = queue.current.then(async () => {
        const result = await saveForm(form.id, JSON.parse(snapshot)).catch(() => null);
        if (result?.ok) {
          setSavedSnapshot(snapshot);
          setError(false);
        } else {
          setError(true);
        }
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [dirty, snapshot, form.id, attempt]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  return {
    status: error ? "error" : dirty ? "saving" : "saved",
    retry: () => setAttempt((n) => n + 1),
  };
}

function BuilderLoaded({ form, initialPublished }: { form: Form; initialPublished: string | null }) {
  const formId = form.id;
  const edit = useFormsStore((s) => s.edit);
  const undo = useFormsStore((s) => s.undo);
  const redo = useFormsStore((s) => s.redo);
  const { canUndo, canRedo } = useCanUndoRedo(formId);
  const save = useAutosave(form);
  const publishing = usePublishing(form, initialPublished);

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
      // Browser autofill fires keydown events with no `key`; ignore them.
      if (typeof e.key !== "string") return;
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
      <ShareDialog
        formId={formId}
        open={publishing.shareOpen}
        onOpenChange={publishing.setShareOpen}
        onUnpublish={publishing.unpublish}
      />
      <div className="flex h-dvh flex-col bg-muted/50">
        <BuilderHeader
          title={form.title}
          saveStatus={save.status}
          onRetrySave={save.retry}
          formId={formId}
          publishState={publishing.state}
          publishing={publishing.publishing}
          onPublish={publishing.publish}
          onShare={() => publishing.setShareOpen(true)}
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

export function BuilderSkeleton() {
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
