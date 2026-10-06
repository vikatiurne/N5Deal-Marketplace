"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, UserRound } from "lucide-react";

import { useLocaleHref, useT } from "@/i18n/client";
import { isUkPath, stripUkPrefix } from "@/i18n/config";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/buyer",
    label: "buyer.nav.dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/buyer/profile",
    label: "buyer.nav.profile",
    icon: UserRound,
    exact: false,
  },
  {
    href: "/buyer/inquiries",
    label: "buyer.nav.inquiries",
    icon: FileText,
    exact: false,
  },
] as const;

export function BuyerNav() {
  const t = useT();
  const href = useLocaleHref();
  const pathname = usePathname();
  // On /uk/... the browser keeps the prefix the middleware rewrote away.
  const currentPath = isUkPath(pathname) ? stripUkPrefix(pathname) : pathname;

  return (
    <nav
      aria-label={t("buyer.nav.ariaLabel")}
      className="flex flex-col gap-4 lg:sticky lg:top-20"
    >
      {/* Below `sm` the 5-entry strip could not fit 375px and hid items behind a scroll nobody could see; a 2-column grid shows every entry with no horizontal scroll at all. */}
      <ul className="grid grid-cols-2 gap-1 sm:flex sm:overflow-x-auto lg:flex-col">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? currentPath === item.href
            : currentPath.startsWith(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={href(item.href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {t(item.label)}
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href={href("/assets")}
        className="text-sm text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
      >
        {t("buyer.nav.browse")}
      </Link>
    </nav>
  );
}
