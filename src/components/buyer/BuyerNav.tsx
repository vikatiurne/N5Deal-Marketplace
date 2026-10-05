"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/buyer", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    href: "/buyer/profile",
    label: "My profile",
    icon: UserRound,
    exact: false,
  },
  {
    href: "/buyer/inquiries",
    label: "Inquiries",
    icon: FileText,
    exact: false,
  },
] as const;

export function BuyerNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Buyer" className="flex flex-col gap-4 lg:sticky lg:top-20">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href="/assets"
        className="text-sm text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
      >
        Browse marketplace →
      </Link>
    </nav>
  );
}
