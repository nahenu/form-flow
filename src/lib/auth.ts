import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, dbReady, schema } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  session: {
    // Avoid a database round trip on every request; sessions are re-checked every 5 minutes.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  plugins: [nextCookies()],
});

export async function getSession() {
  // Read the request first: it marks the page as dynamic, so prerendering stops here and never touches the database.
  const requestHeaders = await headers();
  await dbReady();
  return auth.api.getSession({ headers: requestHeaders });
}

/** The signed-in user, or a redirect to sign in (preserving where they were going). */
export async function requireUser(returnTo?: string) {
  const session = await getSession();
  if (!session) redirect(returnTo ? `/sign-in?next=${encodeURIComponent(returnTo)}` : "/sign-in");
  return session.user;
}
