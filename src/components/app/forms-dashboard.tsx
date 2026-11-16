"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, FileText, LayoutTemplate, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { countFields } from "@/lib/forms/operations";
import { useFormsStore, useHydrated } from "@/lib/forms/store";
import type { Form } from "@/lib/forms/types";
import { timeAgo } from "@/lib/time";
import { AppHeader } from "./app-header";

export function FormsDashboard() {
  const hydrated = useHydrated();
  const router = useRouter();
  const forms = useFormsStore((s) => s.forms);
  const createForm = useFormsStore((s) => s.createForm);
  const list = Object.values(forms).sort((a, b) => b.updatedAt - a.updatedAt);

  function create(template: "blank" | "lead") {
    const id = createForm(template);
    router.push(`/builder/${id}`);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/40">
      <AppHeader />
      <Toaster position="bottom-center" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-foreground sm:text-4xl">Your forms</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Saved in this browser for now. Accounts and sync are on the way.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => create("lead")}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-muted"
            >
              <LayoutTemplate className="size-4" /> Lead form template
            </button>
            <button
              onClick={() => create("blank")}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0b3aa6]"
            >
              <Plus className="size-4" /> New form
            </button>
          </div>
        </div>

        <div className="mt-8">
          {!hydrated ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-white" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <EmptyState onCreate={create} />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((form) => (
                <FormCard key={form.id} form={form} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function FormCard({ form }: { form: Form }) {
  const router = useRouter();
  const duplicateForm = useFormsStore((s) => s.duplicateForm);
  const deleteForm = useFormsStore((s) => s.deleteForm);
  const restoreForm = useFormsStore((s) => s.restoreForm);
  const fields = countFields(form);

  function remove() {
    const removed = deleteForm(form.id);
    if (!removed) return;
    toast(`Deleted "${removed.title}"`, {
      action: { label: "Undo", onClick: () => restoreForm(removed) },
    });
  }

  return (
    <li className="group relative flex flex-col rounded-2xl border border-border bg-white p-5 transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-[0_12px_32px_-16px_rgba(9,49,141,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
          <FileText className="size-5" />
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative z-10 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Actions for ${form.title}`}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                const id = duplicateForm(form.id);
                if (id) router.push(`/builder/${id}`);
              }}
            >
              <Copy /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={remove}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Link href={`/builder/${form.id}`} className="mt-4 after:absolute after:inset-0 after:rounded-2xl">
        <h2 className="truncate font-display text-lg text-foreground">{form.title || "Untitled form"}</h2>
      </Link>
      <p className="mt-1 text-sm text-muted-foreground">
        {form.steps.length} {form.steps.length === 1 ? "step" : "steps"} · {fields} {fields === 1 ? "field" : "fields"}
      </p>
      <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">Edited {timeAgo(form.updatedAt)}</p>
    </li>
  );
}

function EmptyState({ onCreate }: { onCreate: (t: "blank" | "lead") => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-input bg-white px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-[#b8326f]">
        <FileText className="size-6" />
      </span>
      <h2 className="mt-5 font-display text-xl text-foreground">No forms yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Start from the lead form template to see a full multi-step form, or begin with a blank one.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => onCreate("lead")}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white hover:bg-[#0b3aa6]"
        >
          <LayoutTemplate className="size-4" /> Use the lead template
        </button>
        <button
          onClick={() => onCreate("blank")}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
        >
          <Plus className="size-4" /> Blank form
        </button>
      </div>
    </div>
  );
}
