import Link from "next/link";

import { cn } from "@/lib/utils";

type Role = "BUYER" | "SELLER" | "MANAGER";

interface NavItem {
  href: string;
  label: string;
  /** Roles that see this link; null means public (everyone sees it). */
  roles: Role[] | null;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/assets", label: "Browse assets", roles: null },
  { href: "/buyer", label: "For buyers", roles: ["BUYER"] },
  { href: "/seller", label: "For sellers", roles: ["SELLER"] },
  { href: "/manager", label: "Manager", roles: ["MANAGER"] },
  { href: "/login", label: "Sign in", roles: null },
  { href: "/register", label: "Register", roles: null },
];

// Placeholder until auth lands in task 03 — the shell renders as a guest.
const currentRole: Role | null = null;

export function SiteHeader() {
  const visibleItems = NAV_ITEMS.filter(
    (item) =>
      item.roles === null ||
      (currentRole !== null && item.roles.includes(currentRole)),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            N5
          </span>
          <span className="text-base font-semibold tracking-tight">N5Deal</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
