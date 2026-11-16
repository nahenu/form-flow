"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-next";
import { useHydrated } from "@/lib/use-hydrated";

/** `?next=` read at click time rather than via a hook, so the form can render statically. */
function currentNext() {
  return new URLSearchParams(window.location.search).get("next");
}

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const isSignUp = mode === "sign-up";
  const otherPage = isSignUp ? "/sign-in" : "/sign-up";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();

    setPending(true);
    setError(null);
    const { error } = isSignUp
      ? await authClient.signUp.email({ name, email, password })
      : await authClient.signIn.email({ email, password });

    if (error) {
      setPending(false);
      setError(
        error.status === 401 || error.code === "INVALID_EMAIL_OR_PASSWORD"
          ? "That email and password don't match."
          : (error.message ?? "Something went wrong. Please try again."),
      );
      return;
    }
    router.push(safeNext(currentNext()));
    router.refresh();
  }

  return (
    // method="post": if someone submits before JavaScript loads, credentials must never land in the URL.
    <form onSubmit={onSubmit} method="post" className="space-y-4">
      {isSignUp && (
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
            Your name
          </label>
          <Input id="name" name="name" autoComplete="name" required className="h-11 rounded-lg" />
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
          Work email
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" required className="h-11 rounded-lg" placeholder="you@company.com" />
      </div>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          {isSignUp && <span className="text-xs text-muted-foreground">At least 8 characters</span>}
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={8}
            required
            className="h-11 rounded-lg pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/5 px-3 py-2.5 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !hydrated}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-[#0b3aa6] disabled:opacity-70"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {isSignUp ? "Create account" : "Sign in"}
      </button>

      <p className="pt-2 text-center text-sm text-muted-foreground">
        {isSignUp ? "Already have an account? " : "New to FormFlow? "}
        <Link
          href={otherPage}
          onClick={(e) => {
            // Carry ?next= across so the visitor still lands where they were headed.
            const next = currentNext();
            if (next) {
              e.preventDefault();
              router.push(`${otherPage}?next=${encodeURIComponent(next)}`);
            }
          }}
          className="font-semibold text-primary hover:underline"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
