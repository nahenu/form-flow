import type { ResponseRowView } from "@/lib/analytics";
import type { FormDefinition } from "@/lib/forms/definition";

const dateTime = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function ResponsesTable({ rows, definition }: { rows: ResponseRowView[]; definition: FormDefinition }) {
  const fields = definition.steps.flatMap((s) => s.fields);

  if (rows.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-muted-foreground">No responses yet. They&apos;ll appear here as soon as someone submits.</p>;
  }

  return (
    // Scrolls inside its own box with a sticky header, so 100 rows don't make the page endless.
    <div className="max-h-[30rem] overflow-auto" tabIndex={0} role="region" aria-label="Responses table">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <caption className="sr-only">Latest responses, newest first</caption>
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-border bg-muted text-xs text-muted-foreground">
            <th scope="col" className="sticky left-0 bg-muted px-4 py-2.5 font-semibold">Submitted</th>
            <th scope="col" className="px-4 py-2.5 font-semibold">Source</th>
            {fields.map((f) => (
              <th key={f.id} scope="col" className="max-w-56 truncate px-4 py-2.5 font-semibold" title={f.label}>
                {f.label || "Untitled"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
              <td className="sticky left-0 whitespace-nowrap bg-white px-4 py-2.5 tabular-nums text-muted-foreground">{dateTime.format(r.createdAt)}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{r.source}</td>
              {fields.map((f) => {
                const v = r.answers[f.id];
                return (
                  <td key={f.id} className="max-w-56 truncate px-4 py-2.5 text-foreground" title={v}>
                    {v ?? <span className="text-muted-foreground/60">–</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
