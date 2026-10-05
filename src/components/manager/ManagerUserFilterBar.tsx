"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role, UserStatus } from "@/types";

const ROLE_OPTIONS = Object.values(Role);
const STATUS_OPTIONS = Object.values(UserStatus);

/**
 * All manager filters live in the URL query. The text input is uncontrolled and
 * keyed on the query so Back / Reset re-syncs it.
 */
export function ManagerUserFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryKey = params.toString();

  const role = params.get("role") ?? "";
  const status = params.get("status") ?? "";

  function replace(next: URLSearchParams) {
    next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function applyText(formData: FormData) {
    const next = new URLSearchParams(params.toString());
    const q = String(formData.get("q") ?? "").trim();
    if (q) next.set("q", q);
    else next.delete("q");
    replace(next);
  }

  function changeSelect(key: "role" | "status", value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "") next.delete(key);
    else next.set(key, value);
    replace(next);
  }

  return (
    <Card className="bg-surface">
      <CardContent className="pt-6">
        <form
          key={queryKey}
          action={applyText}
          className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manager-user-q">Search</Label>
            <Input
              id="manager-user-q"
              name="q"
              type="search"
              placeholder="Email, company or name…"
              defaultValue={params.get("q") ?? ""}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label id="manager-user-role-label">Role</Label>
            <Select value={role} onValueChange={(v) => changeSelect("role", v)}>
              <SelectTrigger
                aria-labelledby="manager-user-role-label"
                className="w-40"
              >
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label id="manager-user-status-label">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => changeSelect("status", v)}
            >
              <SelectTrigger
                aria-labelledby="manager-user-status-label"
                className="w-40"
              >
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option[0] + option.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit">Apply</Button>
            {queryKey.length > 0 && (
              <Button type="button" variant="outline" asChild>
                <Link href="/manager/users">Reset</Link>
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
