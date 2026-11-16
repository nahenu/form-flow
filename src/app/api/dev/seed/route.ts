import { and, eq } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { events, forms, responses, user, type TrafficSource } from "@/db/schema";
import { auth } from "@/lib/auth";
import { toDefinition } from "@/lib/forms/definition";
import { formFromTemplate } from "@/lib/forms/templates";
import { newPublicId } from "@/lib/id";

/**
 * Creates a demo account with a published lead form and ~4 weeks of simulated
 * traffic, so the results page has something real to show. Deterministic (seeded
 * PRNG). Allowed in development, or in production with the SEED_SECRET header.
 */
const DEMO = { name: "Demo Account", email: "demo@formflow.dev", password: "formflow-demo" };
const DEMO_TITLE = "Interior design enquiry (demo)";

function allowed(request: Request) {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.SEED_SECRET;
  return !!secret && request.headers.get("x-seed-secret") === secret;
}

function prng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function POST(request: Request) {
  if (!allowed(request)) return new Response("Not found", { status: 404 });
  await dbReady();
  const rand = prng(20261116);
  const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];
  const weighted = <T,>(items: [T, number][]) => {
    let r = rand() * items.reduce((s, [, w]) => s + w, 0);
    for (const [item, w] of items) if ((r -= w) <= 0) return item;
    return items[items.length - 1][0];
  };
  /** Log-normal-ish seconds around a median. */
  const seconds = (median: number) => Math.max(2, Math.round(median * Math.exp((rand() + rand() + rand() - 1.5) * 0.9)));

  // 1. Demo user
  let [demoUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, DEMO.email)).limit(1);
  if (!demoUser) {
    const created = await auth.api.signUpEmail({ body: DEMO });
    demoUser = { id: created.user.id };
  }

  // 2. A fresh published demo form (replacing an earlier one)
  await db.delete(forms).where(and(eq(forms.userId, demoUser.id), eq(forms.id, "demoLeadForm")));
  const definition = { ...toDefinition(formFromTemplate("lead")), title: DEMO_TITLE };
  await db.insert(forms).values({ id: "demoLeadForm", userId: demoUser.id, definition, published: definition, publishedAt: new Date() });

  const [about, home, studio, done] = definition.steps;
  const [nameF, phoneF] = about.fields;
  const [cityF, typeF, videoF] = home.fields;
  const [studioF] = studio.fields;
  const [emailF, dateF] = done.fields;

  // 3. Traffic: [source, weight, conversion multiplier]
  const sources: [TrafficSource, number, number][] = [
    [{ utmSource: "google", utmMedium: "cpc", utmCampaign: "interiors-q4" }, 34, 1.0],
    [{ utmSource: "instagram", utmMedium: "paid-social", utmCampaign: "diwali-offer" }, 24, 0.82],
    [{}, 18, 1.15],
    [{ referrer: "https://www.facebook.com/" }, 12, 0.75],
    [{ utmSource: "newsletter", utmMedium: "email", utmCampaign: "november" }, 7, 1.35],
    [{ referrer: "https://www.houzz.in/" }, 5, 1.1],
  ];
  const first = ["Aarav", "Diya", "Kabir", "Meera", "Rohan", "Ananya", "Vikram", "Isha", "Arjun", "Priya", "Neel", "Sara"];
  const last = ["Sharma", "Iyer", "Reddy", "Mehta", "Nair", "Gupta", "Rao", "Kapoor", "Das", "Menon"];

  const eventRows: (typeof events.$inferInsert)[] = [];
  const responseRows: (typeof responses.$inferInsert)[] = [];
  const DAYS = 28;

  for (let day = DAYS - 1; day >= 0; day--) {
    const date = new Date(Date.now() - day * 86_400_000);
    const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    const visitorsToday = Math.round((weekend ? 11 : 17) + rand() * 6 + (DAYS - day) * 0.15);

    for (let v = 0; v < visitorsToday; v++) {
      const visitorId = crypto.randomUUID();
      const [source, , boost] = weighted(sources.map((s) => [s, s[1]] as [typeof s, number]));
      let t = date.getTime() - Math.floor(rand() * 20 * 3_600_000);
      const at = () => new Date(t);
      const base = { formId: "demoLeadForm", visitorId };

      eventRows.push({ ...base, type: "view", source, createdAt: at() });
      const answers: Record<string, string> = {};
      let total = 0;

      const step = (stepId: string, median: number, pContinue: number) => {
        eventRows.push({ ...base, type: "step_view", stepId, createdAt: at() });
        if (rand() > Math.min(0.97, pContinue * boost)) return false;
        const s = seconds(median);
        t += s * 1000;
        total += s;
        eventRows.push({ ...base, type: "step_complete", stepId, durationMs: s * 1000, createdAt: at() });
        return true;
      };

      if (!step(about.id, 14, 0.84)) continue;
      const fn = pick(first);
      const ln = pick(last);
      answers[nameF.id] = `${fn} ${ln}`;
      answers[phoneF.id] = `98${String(Math.floor(rand() * 1e8)).padStart(8, "0")}`;

      // "Your home" is where most people give up in this demo: the step to fix.
      if (!step(home.id, 31, 0.6)) continue;
      const city = weighted(cityF.options.map((c) => [c, c === "Bengaluru" ? 40 : 12] as [string, number]));
      answers[cityF.id] = city;
      answers[typeF.id] = pick(typeF.options);
      if (city !== "Bengaluru" && rand() < 0.8) answers[videoF.id] = pick(videoF.options);

      if (city === "Bengaluru") {
        if (!step(studio.id, 9, 0.86)) continue;
        answers[studioF.id] = pick(studioF.options);
      }

      if (!step(done.id, 17, 0.9)) continue;
      answers[emailF.id] = `${fn}.${ln}${Math.floor(rand() * 90 + 10)}@example.com`.toLowerCase();
      if (rand() < 0.7) answers[dateF.id] = new Date(t + (30 + rand() * 150) * 86_400_000).toISOString().slice(0, 10);

      eventRows.push({ ...base, type: "submit", createdAt: at() });
      responseRows.push({ id: newPublicId(16), ...base, answers, source, durationMs: total * 1000, createdAt: at() });
    }
  }

  for (let i = 0; i < eventRows.length; i += 500) await db.insert(events).values(eventRows.slice(i, i + 500));
  for (let i = 0; i < responseRows.length; i += 200) await db.insert(responses).values(responseRows.slice(i, i + 200));

  return Response.json({
    email: DEMO.email,
    password: DEMO.password,
    formId: "demoLeadForm",
    events: eventRows.length,
    responses: responseRows.length,
  });
}
