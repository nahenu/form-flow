import { site } from "@/lib/site";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Logo className="text-foreground" />
          <span className="hidden h-4 w-px bg-rule sm:block" />
          <span>Designed and built by {site.author}.</span>
        </div>
        <div className="flex gap-5">
          <a href={site.repo} target="_blank" rel="noreferrer" className="hover:text-foreground">
            Source on GitHub
          </a>
          <span className="font-mono text-xs leading-5">© 2026</span>
        </div>
      </div>
    </footer>
  );
}
