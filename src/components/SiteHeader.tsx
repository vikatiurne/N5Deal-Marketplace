import Link from "next/link";
import { ChevronDown, LogOut, Menu } from "lucide-react";

import { logoutAction } from "@/server/auth";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ROLE_LABELS, ROLE_STYLES } from "@/lib/badgeStyles";
import { getSession } from "@/lib/auth/guards";
import { ROLE_HOME } from "@/lib/auth/types";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

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

const NAV_LINK_CLASS =
  "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

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
        <Link
          href="/"
          aria-label="N5Deal — home"
          className="flex shrink-0 items-center gap-2"
        >
          <Logo />
          <span className="text-base font-semibold tracking-tight">Deal</span>
        </Link>

        {/* The horizontal nav overflowed 375px by ~25px, so below `md` the
            links move into a drawer and only the brand + menu button stay. */}
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(NAV_LINK_CLASS, "px-2.5 py-1.5")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {currentRole !== null && (
            /* The session is now visible: name plus a role badge. Previously
               the only sign-in signal was which nav link appeared. */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden h-8 gap-1.5 px-2 md:inline-flex"
                >
                  <span className="max-w-32 truncate text-sm">
                    {session?.email}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-4 px-1.5 text-[0.65rem]",
                      ROLE_STYLES[currentRole],
                    )}
                  >
                    {ROLE_LABELS[currentRole]}
                  </Badge>
                  <ChevronDown
                    className="size-3.5 opacity-60"
                    aria-hidden="true"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {session?.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={ROLE_HOME[currentRole]}>My dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/assets">Browse assets</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild variant="destructive">
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 text-left"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      Logout
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open main menu"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  {currentRole !== null && session
                    ? `${session.email} · ${ROLE_LABELS[currentRole]}`
                    : "Sign in or create an account to reach your dashboard."}
                </SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1">
                {visibleItems.map((item) => (
                  <SheetClose key={item.href} asChild>
                    <Link href={item.href} className={NAV_LINK_CLASS}>
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              {currentRole !== null && (
                <form action={logoutAction} className="mt-auto">
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Logout
                  </Button>
                </form>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
