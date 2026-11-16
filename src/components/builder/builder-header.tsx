"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, CloudCheck, CloudOff, Eye, Loader2, PencilLine, Redo2, Send, Undo2, Workflow } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LogoMark } from "@/components/marketing/logo";
import { cn } from "@/lib/utils";

export type BuilderMode = "edit" | "flow" | "preview";

export type PublishState = "draft" | "live" | "changed";

interface BuilderHeaderProps {
  formId: string;
  publishState: PublishState;
  publishing: boolean;
  onPublish: () => void;
  onShare: () => void;
  title: string;
  saveStatus: "saved" | "saving" | "error";
  onRetrySave: () => void;
  mode: BuilderMode;
  canUndo: boolean;
  canRedo: boolean;
  onTitleChange: (title: string) => void;
  onModeChange: (mode: BuilderMode) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function BuilderHeader(props: BuilderHeaderProps) {
  const { title, saveStatus, mode, canUndo, canRedo } = props;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-white px-3 sm:gap-3 sm:px-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/dashboard"
            aria-label="Back to your forms"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>Your forms</TooltipContent>
      </Tooltip>
      <LogoMark className="hidden size-6 rounded-md sm:grid [&_svg]:size-3.5" />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <input
          value={title}
          onChange={(e) => props.onTitleChange(e.target.value)}
          aria-label="Form title"
          placeholder="Untitled form"
          className="min-w-0 max-w-xs flex-1 truncate rounded-md bg-transparent px-2 py-1 font-display text-base text-foreground outline-none hover:bg-muted focus:bg-muted sm:text-lg"
        />
        {/* Autosave status, not a button: explained on hover/focus so nobody hunts for a "Save" button. */}
        <div className="hidden shrink-0 items-center gap-1 text-xs md:flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                aria-live="polite"
                className="inline-flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {saveStatus === "saved" && (
                  <>
                    <CloudCheck className="size-4 text-primary" aria-hidden /> All changes saved
                  </>
                )}
                {saveStatus === "saving" && (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden /> Saving…
                  </>
                )}
                {saveStatus === "error" && (
                  <>
                    <CloudOff className="size-4 text-destructive" aria-hidden /> Couldn&apos;t save
                  </>
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent>FormFlow saves automatically as you edit. There&apos;s no save button.</TooltipContent>
          </Tooltip>
          {saveStatus === "error" && (
            <button type="button" onClick={props.onRetrySave} className="font-semibold text-primary hover:underline">
              Retry
            </button>
          )}
        </div>
      </div>

      <div role="tablist" aria-label="Builder mode" className="flex shrink-0 rounded-lg bg-secondary p-0.5 text-sm font-medium">
        {(
          [
            ["edit", "Edit", PencilLine],
            ["flow", "Flow", Workflow],
            ["preview", "Preview", Eye],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            role="tab"
            aria-selected={mode === value}
            onClick={() => props.onModeChange(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors sm:px-3",
              mode === value ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <IconButton label="Undo" shortcut="Ctrl Z" disabled={!canUndo} onClick={props.onUndo}>
          <Undo2 className="size-4" />
        </IconButton>
        <IconButton label="Redo" shortcut="Ctrl Shift Z" disabled={!canRedo} onClick={props.onRedo}>
          <Redo2 className="size-4" />
        </IconButton>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/forms/${props.formId}/results`}
            aria-label="Results"
            className="hidden size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground sm:grid"
          >
            <BarChart3 className="size-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>Results and funnel</TooltipContent>
      </Tooltip>

      {props.publishState !== "draft" && (
        <button
          type="button"
          onClick={props.onShare}
          className="hidden h-9 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted sm:inline-flex"
        >
          <span className="size-2 rounded-full bg-emerald-500" aria-hidden /> Share
        </button>
      )}
      {props.publishState !== "live" && (
        <button
          type="button"
          onClick={props.onPublish}
          disabled={props.publishing}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-[#0b3aa6] disabled:opacity-70 sm:px-4"
        >
          {props.publishing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 sm:hidden" />}
          <span className="hidden sm:inline">{props.publishState === "changed" ? "Publish changes" : "Publish"}</span>
        </button>
      )}
    </header>
  );
}

function IconButton({
  label,
  shortcut,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-keyshortcuts={shortcut.replace(/ /g, "+").replace("Ctrl", "Control")}
          disabled={disabled}
          onClick={onClick}
          className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {label} <span className="ml-1 opacity-60">{shortcut}</span>
      </TooltipContent>
    </Tooltip>
  );
}
