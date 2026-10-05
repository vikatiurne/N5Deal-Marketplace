import Link from "next/link";

import { logoutAction } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/guards";
import { ROLE_HOME } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

type Role = "BUYER" | "SELLER" | "MANAGER";

interface NavItem {
  href: string;
  label: string;
  /** Roles that see this link; null means public (everyone sees it). */
  roles: Role[] | null;
  /** auth === false → only shown to logged-out visitors. */
  auth?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/assets", label: "Browse assets", roles: null },
  { href: ROLE_HOME.BUYER, label: "For buyers", roles: ["BUYER"] },
  { href: ROLE_HOME.SELLER, label: "For sellers", roles: ["SELLER"] },
  { href: ROLE_HOME.MANAGER, label: "Manager", roles: ["MANAGER"] },
  { href: "/login", label: "Sign in", roles: null, auth: false },
  { href: "/register", label: "Register", roles: null, auth: false },
];

export async function SiteHeader() {
  const session = await getSession();
  const currentRole = session?.status === "ACTIVE" ? session.role : null;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.auth === false) return currentRole === null;
    return (
      item.roles === null ||
      (currentRole !== null && item.roles.includes(currentRole))
    );
  });

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
          {currentRole !== null && (
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Logout
              </Button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
