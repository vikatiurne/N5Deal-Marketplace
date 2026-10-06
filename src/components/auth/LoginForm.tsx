"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useLocaleHref, useT } from "@/i18n/client";
import type { MessageKey } from "@/i18n/core";

/** Maps Auth.js `code` query values to message keys. */
const ERROR_KEYS: Record<string, MessageKey> = {
  account_suspended: "auth.error.accountSuspended",
  account_deleted: "auth.error.accountDeleted",
  no_account: "auth.error.invalidCredentials",
  invalid_password: "auth.error.invalidCredentials",
  credentials: "auth.error.invalidCredentials",
  Configuration: "auth.error.configuration",
  AccessDenied: "auth.error.accessDenied",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const t = useT();
  const localizedHref = useLocaleHref();

  const next = searchParams.get("next");
  const urlError = searchParams.get("error") ?? searchParams.get("code");
  const registered = searchParams.get("registered") === "1";
  const initialError = urlError
    ? t(ERROR_KEYS[urlError] ?? "auth.error.signInFailed")
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
        const message = t(ERROR_KEYS[code] ?? "auth.error.signInFailedRetry");
        setError(message);
        toast({
          title: t("auth.login.toast.failedTitle"),
          description: message,
          variant: "destructive",
        });
        return;
      }
      // "/" resolves the role home for the fresh session.
      router.push(next ?? localizedHref("/"));
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {initialError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-text"
        >
          {initialError}
        </p>
      )}
      {registered && !initialError && (
        <p
          role="status"
          className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
        >
          {t("auth.login.registeredNotice")}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-text"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("common.email")}</Label>
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
        <Label htmlFor="password">{t("auth.field.password")}</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? t("auth.login.submitPending") : t("nav.signIn")}
      </Button>
    </form>
  );
}
