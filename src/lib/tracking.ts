import type { TrafficSource } from "@/db/schema";

const VISITOR_KEY = "ff_vid";
const SOURCE_KEY = "ff_src";

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // Private mode or blocked storage: tracking still works, just per page load.
  }
}

/** Anonymous id for counting unique visitors. Not linked to any personal data. */
export function getVisitorId(): string {
  const storage = safeStorage();
  const existing = storage?.getItem(VISITOR_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  storage?.setItem(VISITOR_KEY, id);
  return id;
}

/**
 * First-touch attribution: the campaign that first brought this visitor,
 * remembered across later visits. Embedded forms receive the host page's UTM
 * params and URL through their own query string (see public/embed.js).
 */
export function getFirstTouchSource(): TrafficSource {
  const storage = safeStorage();
  const saved = storage?.getItem(SOURCE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as TrafficSource;
    } catch {
      /* fall through and recompute */
    }
  }

  const params = new URLSearchParams(window.location.search);
  const referrer = params.get("ff_ref") ?? document.referrer;
  const source: TrafficSource = {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    referrer: referrer && !sameSite(referrer) ? referrer.slice(0, 500) : undefined,
  };
  storage?.setItem(SOURCE_KEY, JSON.stringify(source));
  return source;
}

function sameSite(url: string) {
  try {
    return new URL(url).host === window.location.host;
  } catch {
    return false;
  }
}

type TrackedEvent = { type: "view" | "step_view" | "step_complete"; stepId?: string; durationMs?: number };

/**
 * Batches funnel events and sends them with sendBeacon, which survives the tab
 * closing. Failures are ignored on purpose: analytics must never break a form.
 */
export function createTracker(formId: string) {
  const visitorId = getVisitorId();
  const source = getFirstTouchSource();
  const queue: TrackedEvent[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  function flush() {
    if (timer) clearTimeout(timer);
    timer = null;
    if (!queue.length) return;
    const body = JSON.stringify({ formId, visitorId, source, events: queue.splice(0, 25) });
    const sent = navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }));
    if (!sent) void fetch("/api/events", { method: "POST", body, keepalive: true }).catch(() => {});
    if (queue.length) flush();
  }

  function push(event: TrackedEvent) {
    queue.push(event);
    timer ??= setTimeout(flush, 1000);
  }

  const onHide = () => {
    if (document.visibilityState === "hidden") flush();
  };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", flush);

  return {
    visitorId,
    source,
    view: () => push({ type: "view" }),
    stepView: (stepId: string) => push({ type: "step_view", stepId }),
    stepComplete: (stepId: string, durationMs: number) => push({ type: "step_complete", stepId, durationMs }),
    flush,
    dispose() {
      flush();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    },
  };
}

export type Tracker = ReturnType<typeof createTracker>;
