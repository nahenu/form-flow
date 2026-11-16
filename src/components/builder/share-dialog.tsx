"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useHydrated } from "@/lib/use-hydrated";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label={label}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground hover:bg-muted"
    >
      {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function ShareDialog({
  formId,
  open,
  onOpenChange,
  onUnpublish,
}: {
  formId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnpublish: () => Promise<void>;
}) {
  const hydrated = useHydrated();
  const [unpublishing, setUnpublishing] = useState(false);
  const origin = hydrated ? window.location.origin : "";
  const url = `${origin}/f/${formId}`;
  const embed = `<div data-formflow="${formId}"></div>\n<script async src="${origin}/embed.js"></script>`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden /> Your form is live
          </DialogTitle>
          <DialogDescription>Anyone with the link can fill it in. Edits stay private until you publish again.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <label htmlFor="share-url" className="mb-1.5 block text-xs font-semibold text-foreground">
              Public link
            </label>
            <div className="flex gap-2">
              <input
                id="share-url"
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-muted/60 px-3 text-sm text-foreground outline-none focus-visible:border-primary"
              />
              <CopyButton text={url} label="Copy public link" />
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                aria-label="Open the live form in a new tab"
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-white text-foreground hover:bg-muted"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Embed on your website</span>
              <CopyButton text={embed} label="Copy embed code" />
            </div>
            <pre className="overflow-x-auto rounded-lg bg-[#061f5c] p-3 font-mono text-[12px] leading-5 text-white/85">{embed}</pre>
            <p className="mt-1.5 text-xs text-muted-foreground">Paste it where the form should appear. It resizes itself and passes UTM tags through.</p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            disabled={unpublishing}
            onClick={async () => {
              setUnpublishing(true);
              await onUnpublish();
              setUnpublishing(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-60"
          >
            {unpublishing && <Loader2 className="size-4 animate-spin" />} Unpublish
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-[#0b3aa6]"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
