"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Maps Auth.js `code` query values to human-readable messages. */
const ERROR_MESSAGES: Record<string, string> = {
  account_suspended: "This account is suspended. Contact the platform manager.",
  account_deleted: "This account has been deleted.",
  no_account: "Invalid email or password.",
  invalid_password: "Invalid email or password.",
  credentials: "Invalid email or password.",
  Configuration: "Sign-in is misconfigured. Try again later.",
  AccessDenied: "You do not have access to this account.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const next = searchParams.get("next");
  const urlError = searchParams.get("error") ?? searchParams.get("code");
  const registered = searchParams.get("registered") === "1";
  const initialError = urlError
    ? (ERROR_MESSAGES[urlError] ?? "Sign-in failed.")
    : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        const code = result.code ?? "credentials";
        setError(ERROR_MESSAGES[code] ?? "Sign-in failed. Try again.");
        return;
      }
      // "/" resolves the role home for the fresh session.
      router.push(next ?? "/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {initialError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {initialError}
        </p>
      )}
      {registered && !initialError && (
        <p
          role="status"
          className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
        >
          Account created. You can sign in now.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="buyer1@n5deal.test"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
