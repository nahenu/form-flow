/**
 * Public URL of the app. On Vercel it comes from the project's production
 * domain automatically, so NEXT_PUBLIC_SITE_URL is only needed to override it
 * (e.g. a custom domain that isn't the primary one).
 */
const vercelProduction = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

export const site = {
  name: "FormFlow",
  url: process.env.NEXT_PUBLIC_SITE_URL || (vercelProduction ? `https://${vercelProduction}` : "http://localhost:3001"),
  repo: "https://github.com/nahenu/form-flow",
  author: "Arpit Goyal",
} as const;
