import { create } from "zustand";
import type { Form } from "./types";

const HISTORY_LIMIT = 100;
/** Edits to the same thing within this window collapse into one undo step (e.g. typing a label). */
const COALESCE_MS = 1000;

interface History {
  past: Form[];
  future: Form[];
}

/**
 * In-memory editing state for open forms: the working copy plus undo/redo
 * history. The server is the source of truth; the builder loads a form in on
 * mount, autosaves changes, and unloads it on unmount.
 */
interface FormsState {
  forms: Record<string, Form>;
  history: Record<string, History>;
  lastEdit: { formId: string; key: string; at: number } | null;

  load: (form: Form) => void;
  unload: (formId: string) => void;
  /**
   * Apply `recipe` to a clone of the form and record the previous version for
   * undo. Pass `coalesceKey` for rapid repeated edits (typing) to group them.
   */
  edit: (formId: string, recipe: (draft: Form) => void, coalesceKey?: string) => void;
  undo: (formId: string) => void;
  redo: (formId: string) => void;
}

const emptyHistory: History = { past: [], future: [] };

export const useFormsStore = create<FormsState>()((set, get) => ({
  forms: {},
  history: {},
  lastEdit: null,

  load(form) {
    set((s) => ({
      forms: { ...s.forms, [form.id]: form },
      history: { ...s.history, [form.id]: emptyHistory },
    }));
  },

  unload(formId) {
    set((s) => {
      const forms = { ...s.forms };
      const history = { ...s.history };
      delete forms[formId];
      delete history[formId];
      return { forms, history };
    });
  },

  edit(formId, recipe, coalesceKey) {
    const s = get();
    const current = s.forms[formId];
    if (!current) return;

    const draft = structuredClone(current);
    recipe(draft);
    draft.updatedAt = Date.now();

    const now = Date.now();
    const h = s.history[formId] ?? emptyHistory;
    const coalesce =
      coalesceKey !== undefined &&
      s.lastEdit?.formId === formId &&
      s.lastEdit.key === coalesceKey &&
      now - s.lastEdit.at < COALESCE_MS;

    set({
      forms: { ...s.forms, [formId]: draft },
      history: {
        ...s.history,
        [formId]: { past: coalesce ? h.past : [...h.past, current].slice(-HISTORY_LIMIT), future: [] },
      },
      lastEdit: coalesceKey !== undefined ? { formId, key: coalesceKey, at: now } : null,
    });
  },

  undo(formId) {
    const s = get();
    const h = s.history[formId];
    const current = s.forms[formId];
    if (!h?.past.length || !current) return;
    const previous = h.past[h.past.length - 1];
    set({
      forms: { ...s.forms, [formId]: previous },
      history: { ...s.history, [formId]: { past: h.past.slice(0, -1), future: [current, ...h.future] } },
      lastEdit: null,
    });
  },

  redo(formId) {
    const s = get();
    const h = s.history[formId];
    const current = s.forms[formId];
    if (!h?.future.length || !current) return;
    const [next, ...rest] = h.future;
    set({
      forms: { ...s.forms, [formId]: next },
      history: { ...s.history, [formId]: { past: [...h.past, current], future: rest } },
      lastEdit: null,
    });
  },
}));

export function useCanUndoRedo(formId: string) {
  const h = useFormsStore((s) => s.history[formId]);
  return { canUndo: !!h?.past.length, canRedo: !!h?.future.length };
}
