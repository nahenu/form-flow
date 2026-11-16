import { site } from "@/lib/site";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-14 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Logo className="text-foreground" />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Forms with step-by-step analytics. Designed and built by {site.author}.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-16 gap-y-2.5 text-sm">
          <span className="mb-1 font-semibold text-foreground">Product</span>
          <span className="mb-1 font-semibold text-foreground">Project</span>
          <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
          <a href={site.repo} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">Source code</a>
          <a href="#embed" className="text-muted-foreground hover:text-foreground">Embed</a>
          <a href={`${site.repo}#roadmap`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">Roadmap</a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</a>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>© 2026 {site.author}</span>
          <span>
            UI pieces from{" "}
            <a className="underline hover:text-foreground" href="https://magicui.design" target="_blank" rel="noreferrer">Magic UI</a>,{" "}
            <a className="underline hover:text-foreground" href="https://skiper-ui.com" target="_blank" rel="noreferrer">Skiper UI</a> and{" "}
            <a className="underline hover:text-foreground" href="https://www.vengenceui.com" target="_blank" rel="noreferrer">Vengeance UI</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
