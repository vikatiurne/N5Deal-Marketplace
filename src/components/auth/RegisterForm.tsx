"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { registerAction } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useLocaleHref, useT } from "@/i18n/client";
import type { MessageKey } from "@/i18n/core";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const ROLE_OPTIONS: Array<{
  value: Extract<Role, "BUYER" | "SELLER">;
  labelKey: MessageKey;
  hintKey: MessageKey;
}> = [
  {
    value: "BUYER",
    labelKey: "common.role.buyer",
    hintKey: "auth.register.roleBuyerHint",
  },
  {
    value: "SELLER",
    labelKey: "common.role.seller",
    hintKey: "auth.register.roleSellerHint",
  },
];

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<Extract<Role, "BUYER" | "SELLER">>("BUYER");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const t = useT();
  const localizedHref = useLocaleHref();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await registerAction({
        email,
        password,
        displayName,
        role,
      });
      if (!result.ok) {
        const message =
          result.error === "email_taken"
            ? t("auth.register.emailTaken")
            : (result.error ?? "Registration failed.");
        setError(message);
        toast({
          title: t("auth.register.toast.failedTitle"),
          description: message,
          variant: "destructive",
        });
        return;
      }
      router.push(localizedHref(result.redirectTo ?? "/"));
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-text"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">{t("auth.field.displayName")}</Label>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-email">{t("common.email")}</Label>
        <Input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-password">{t("auth.field.password")}</Label>
        <PasswordInput
          id="reg-password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.register.passwordPlaceholder")}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium mb-2">
          {t("auth.register.roleLegend")}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-md border p-3 transition-colors hover:border-primary/40",
                role === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border",
              )}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{t(option.labelKey)}</span>
              <span className="text-xs text-muted-foreground">
                {t(option.hintKey)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" disabled={isPending}>
        {isPending ? t("auth.register.submitPending") : t("home.createAccount")}
      </Button>
    </form>
  );
}
