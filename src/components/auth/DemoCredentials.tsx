"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEMO_ACCOUNTS } from "@/lib/auth/demoAccounts";
import { useT } from "@/i18n/client";
import { ROLE_KEYS, USER_STATUS_KEYS, type MessageKey } from "@/i18n/core";
import type { UserStatus } from "@/types";

const DEMO_ROLE_KEYS: Record<"Manager" | "Seller" | "Buyer", MessageKey> = {
  Manager: ROLE_KEYS.MANAGER,
  Seller: ROLE_KEYS.SELLER,
  Buyer: ROLE_KEYS.BUYER,
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const t = useT();

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — ignore.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={t("auth.demo.copyAria", { label })}
      onClick={copy}
    >
      {copied ? <Check className="text-primary" /> : <Copy />}
    </Button>
  );
}

export function DemoCredentials({
  statuses = {},
}: {
  statuses?: Partial<Record<string, UserStatus>>;
}) {
  const t = useT();

  return (
    <Card className="bg-surface">
      <CardHeader>
        <CardTitle className="text-base">{t("auth.demo.title")}</CardTitle>
        <CardDescription>
          {t("auth.demo.description")}{" "}
          <code className="text-foreground">password123</code>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-1.5">
        {DEMO_ACCOUNTS.map((account) => {
          const status = statuses[account.email] ?? "ACTIVE";
          return (
            <div
              key={account.email}
              className="flex min-w-0 items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm"
            >
              <Badge
                variant="outline"
                className={
                  account.role === "Manager"
                    ? "shrink-0 border-primary/40 text-primary"
                    : "shrink-0 text-muted-foreground"
                }
              >
                {t(DEMO_ROLE_KEYS[account.role])}
              </Badge>
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <span className="min-w-0 truncate font-mono text-xs">
                  {account.email}
                </span>
                <CopyButton
                  value={account.email}
                  label={t("auth.demo.emailAria", { email: account.email })}
                />
              </div>
              {status !== "ACTIVE" && (
                <Badge
                  variant="outline"
                  title={t("auth.demo.blockedTitle")}
                  className="shrink-0 border-destructive/40 text-destructive"
                >
                  {t(USER_STATUS_KEYS[status])}
                </Badge>
              )}
              <span className="ml-auto flex shrink-0 items-center gap-1">
                <code className="text-xs text-muted-foreground">
                  password123
                </code>
                <CopyButton
                  value={account.password}
                  label={t("auth.demo.passwordAria", { email: account.email })}
                />
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
