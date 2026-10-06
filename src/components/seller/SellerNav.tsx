"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Inbox,
  LayoutDashboard,
  PlusCircle,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/seller", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    href: "/seller/assets",
    label: "My assets",
    icon: BriefcaseBusiness,
    exact: false,
  },
  {
    href: "/seller/assets/new",
    label: "New asset",
    icon: PlusCircle,
    exact: false,
  },
  { href: "/seller/buyers", label: "Buyers", icon: Users, exact: false },
  { href: "/seller/inquiries", label: "Inquiries", icon: Inbox, exact: false },
] as const;

export function SellerNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Seller"
      className="flex flex-col gap-4 lg:sticky lg:top-20"
    >
      {/* Below `sm` the 5-entry strip could not fit 375px and hid items behind a scroll nobody could see; a 2-column grid shows every entry with no horizontal scroll at all. */}
      <ul className="grid grid-cols-2 gap-1 sm:flex sm:overflow-x-auto lg:flex-col">
        {NAV_ITEMS.map((item) => {
          // "/seller/assets/new" must not light up the "My assets" entry.
          const active =
            item.href === "/seller/assets/new"
              ? pathname === item.href
              : item.exact
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
        See public marketplace →
      </Link>
    </nav>
  );
}
