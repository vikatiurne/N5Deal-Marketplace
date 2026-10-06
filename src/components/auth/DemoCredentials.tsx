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

const DEMO_ACCOUNTS: Array<{
  role: "Manager" | "Seller" | "Buyer";
  email: string;
  password: string;
  note?: string;
}> = [
  { role: "Manager", email: "manager@n5deal.test", password: "password123" },
  { role: "Seller", email: "seller1@n5deal.test", password: "password123" },
  { role: "Seller", email: "seller2@n5deal.test", password: "password123" },
  {
    role: "Seller",
    email: "seller3@n5deal.test",
    password: "password123",
    note: "suspended",
  },
  { role: "Buyer", email: "buyer1@n5deal.test", password: "password123" },
  { role: "Buyer", email: "buyer2@n5deal.test", password: "password123" },
  { role: "Buyer", email: "buyer3@n5deal.test", password: "password123" },
  { role: "Buyer", email: "buyer4@n5deal.test", password: "password123" },
  { role: "Buyer", email: "buyer5@n5deal.test", password: "password123" },
];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

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
      aria-label={`Copy ${label}`}
      onClick={copy}
    >
      {copied ? <Check className="text-primary" /> : <Copy />}
    </Button>
  );
}

export function DemoCredentials() {
  return (
    <Card className="bg-surface">
      <CardHeader>
        <CardTitle className="text-base">Demo credentials</CardTitle>
        <CardDescription>
          One password for all seeded accounts:{" "}
          <code className="text-foreground">password123</code>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-1.5">
        {DEMO_ACCOUNTS.map((account) => (
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
              {account.role}
            </Badge>
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <span className="min-w-0 truncate font-mono text-xs">
                {account.email}
              </span>
              <CopyButton
                value={account.email}
                label={`${account.email} email`}
              />
            </div>
            {account.note && (
              <span className="shrink-0 text-xs text-muted-foreground">
                ({account.note})
              </span>
            )}
            <span className="ml-auto flex shrink-0 items-center gap-1">
              <code className="text-xs text-muted-foreground">password123</code>
              <CopyButton
                value={account.password}
                label={`${account.email} password`}
              />
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
