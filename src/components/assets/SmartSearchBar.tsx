"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  buildFilterQuery,
  type SmartSearchResult,
} from "@/lib/ai/smartFilters";

const PLACEHOLDER = "e.g. EMI license in Lithuania under €500k";

/**
 * Natural-language entry point. The model output is never trusted here either:
 * this component only re-serialises what the API already Zod-validated.
 */
export function SmartSearchBar() {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      toast({
        title: "Add a bit more detail",
        description: "Describe licence, country, budget or sector.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      let result: SmartSearchResult | null = null;
      try {
        const response = await fetch("/api/smart-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
        });

        if (response.status === 429) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          toast({
            title: "Slow down a moment",
            description:
              payload?.error ?? "AI search limit reached. Try again shortly.",
            variant: "destructive",
          });
          return;
        }

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          toast({
            title: "AI search unavailable",
            description: payload?.error ?? "Falling back to keyword search.",
            variant: "destructive",
          });
          // Fall back to the plain keyword search the page already supports.
          router.push(`/assets?q=${encodeURIComponent(trimmed)}&ai=1`);
          return;
        }

        result = (await response.json()) as SmartSearchResult;
      } catch {
        toast({
          title: "AI search unavailable",
          description: "Falling back to keyword search.",
          variant: "destructive",
        });
        router.push(`/assets?q=${encodeURIComponent(trimmed)}&ai=1`);
        return;
      }

      const search = buildFilterQuery(result.filters, { ai: "1" });
      router.push(
        `/assets?${search}&exp=${encodeURIComponent(result.explanation)}`,
      );

      if (result.degraded) {
        toast({
          title: "AI parsing unavailable",
          description: "Searched your words as keywords instead.",
        });
      }
    });
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-6">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="smart-search" className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Describe what you are looking for
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="smart-search"
                name="query"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={PLACEHOLDER}
                maxLength={300}
                disabled={isPending}
                className="flex-1"
              />
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                Ask AI
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              AI turns your sentence into licence, country and price filters —
              refine them with the filters below.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
