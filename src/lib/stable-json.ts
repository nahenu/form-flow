/**
 * JSON.stringify with object keys sorted, so two equal values always produce
 * the same string. Postgres jsonb reorders keys, so plain JSON.stringify can't
 * be used to compare a saved form with the one in the editor.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, (v as Record<string, unknown>)[k]]))
      : v,
  );
}
