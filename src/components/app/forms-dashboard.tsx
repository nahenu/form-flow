"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, Copy, FileText, LayoutTemplate, Loader2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createForm, deleteForm, duplicateForm, restoreForm } from "@/app/actions/forms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import type { FormSummary } from "@/lib/forms/server";
import { timeAgo } from "@/lib/time";

type Template = "blank" | "lead";

export function FormsDashboard({ forms }: { forms: FormSummary[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState<Template | null>(null);
  const [, startTransition] = useTransition();
  // Hide deleted cards immediately; the server catches up on refresh.
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const list = forms.filter((f) => !hidden.has(f.id));

  async function create(template: Template) {
    setCreating(template);
    const result = await createForm(template);
    if (result.ok) {
      router.push(`/builder/${result.id}`);
    } else {
      setCreating(null);
      toast.error(result.error);
    }
  }

  async function duplicate(id: string) {
    const result = await duplicateForm(id);
    if (result.ok) router.push(`/builder/${result.id}`);
    else toast.error(result.error);
  }

  async function remove(form: FormSummary) {
    setHidden((h) => new Set(h).add(form.id));
    const result = await deleteForm(form.id);
    if (!result.ok) {
      setHidden((h) => withoutId(h, form.id));
      toast.error(result.error);
      return;
    }
    toast(`Deleted "${form.title || "Untitled form"}"`, {
      action: {
        label: "Undo",
        onClick: async () => {
          const restored = await restoreForm(form.id);
          if (restored.ok) {
            setHidden((h) => withoutId(h, form.id));
            startTransition(() => router.refresh());
          }
        },
      },
    });
  }

  return (
    <>
      <Toaster position="bottom-center" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">Your forms</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {list.length === 0 ? "Create a form to get started." : `${list.length} ${list.length === 1 ? "form" : "forms"}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => create("lead")}
            disabled={!!creating}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-muted disabled:opacity-60"
          >
            {creating === "lead" ? <Loader2 className="size-4 animate-spin" /> : <LayoutTemplate className="size-4" />} Lead form template
          </button>
          <button
            onClick={() => create("blank")}
            disabled={!!creating}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0b3aa6] disabled:opacity-60"
          >
            {creating === "blank" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} New form
          </button>
        </div>
      </div>

      <div className="mt-8">
        {list.length === 0 ? (
          <EmptyState onCreate={create} creating={creating} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((form) => (
              <FormCard key={form.id} form={form} onDuplicate={() => duplicate(form.id)} onDelete={() => remove(form)} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function withoutId(set: Set<string>, id: string) {
  const next = new Set(set);
  next.delete(id);
  return next;
}

function FormCard({ form, onDuplicate, onDelete }: { form: FormSummary; onDuplicate: () => void; onDelete: () => void }) {
  return (
    <li className="group relative flex flex-col rounded-2xl border border-border bg-white p-5 transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-[0_12px_32px_-16px_rgba(9,49,141,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
          <FileText className="size-5" />
        </span>
        <div className="flex items-center gap-1">
          {form.isPublished ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Live
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Draft</span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="relative z-10 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Actions for ${form.title}`}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/forms/${form.id}/results`}>
                  <BarChart3 /> Results
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDuplicate}>
                <Copy /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Link href={`/builder/${form.id}`} className="mt-4 after:absolute after:inset-0 after:rounded-2xl">
        <h2 className="truncate font-display text-lg text-foreground">{form.title || "Untitled form"}</h2>
      </Link>
      <p className="mt-1 text-sm text-muted-foreground">
        {form.stepCount} {form.stepCount === 1 ? "step" : "steps"} · {form.fieldCount} {form.fieldCount === 1 ? "field" : "fields"}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>Edited {timeAgo(form.updatedAt)}</span>
        {/* Sits above the card-wide link, so it opens results instead of the builder. */}
        <Link
          href={`/forms/${form.id}/results`}
          className="relative z-10 inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-foreground hover:bg-secondary hover:text-primary"
        >
          <BarChart3 className="size-3.5" />
          {form.responseCount} {form.responseCount === 1 ? "response" : "responses"}
        </Link>
      </div>
    </li>
  );
}

function EmptyState({ onCreate, creating }: { onCreate: (t: Template) => void; creating: Template | null }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-input bg-white px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-[#b8326f]">
        <FileText className="size-6" />
      </span>
      <h2 className="mt-5 font-display text-xl text-foreground">No forms yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Start from the lead form template to see a full multi-step form with branching, or begin with a blank one.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => onCreate("lead")}
          disabled={!!creating}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white hover:bg-[#0b3aa6] disabled:opacity-60"
        >
          {creating === "lead" ? <Loader2 className="size-4 animate-spin" /> : <LayoutTemplate className="size-4" />} Use the lead template
        </button>
        <button
          onClick={() => onCreate("blank")}
          disabled={!!creating}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
        >
          <Plus className="size-4" /> Blank form
        </button>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your forms">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-white" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-white" />
        ))}
      </div>
    </div>
  );
}
