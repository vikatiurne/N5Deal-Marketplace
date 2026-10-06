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

import { useLocaleHref, useT } from "@/i18n/client";
import { isUkPath, stripUkPrefix } from "@/i18n/config";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/seller",
    labelKey: "seller.nav.dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/seller/assets",
    labelKey: "seller.assets.title",
    icon: BriefcaseBusiness,
    exact: false,
  },
  {
    href: "/seller/assets/new",
    labelKey: "seller.assets.new",
    icon: PlusCircle,
    exact: false,
  },
  {
    href: "/seller/buyers",
    labelKey: "seller.buyers.title",
    icon: Users,
    exact: false,
  },
  {
    href: "/seller/inquiries",
    labelKey: "seller.inquiries.nav",
    icon: Inbox,
    exact: false,
  },
] as const;

export function SellerNav() {
  const pathname = usePathname();
  const t = useT();
  const localizedHref = useLocaleHref();

  // The pathname carries the /uk prefix; match against the logical path so
  // exactly one entry lights up: "/seller/assets" prefix-matches
  // "/seller/assets/new" too, so the most specific match wins.
  const logicalPath = isUkPath(pathname) ? stripUkPrefix(pathname) : pathname;
  const activeHref = NAV_ITEMS.filter((item) =>
    item.exact ? logicalPath === item.href : logicalPath.startsWith(item.href),
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav
      aria-label={t("seller.nav.aria")}
      className="flex flex-col gap-4 lg:sticky lg:top-20"
    >
      {/* Below `sm` the 5-entry strip could not fit 375px and hid items behind a scroll nobody could see; a 2-column grid shows every entry with no horizontal scroll at all. */}
      <ul className="grid grid-cols-2 gap-1 sm:flex sm:overflow-x-auto lg:flex-col">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={localizedHref(item.href)}
                aria-current={item.href === activeHref ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  item.href === activeHref
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href={localizedHref("/assets")}
        className="text-sm text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
      >
        {t("seller.nav.public")}
      </Link>
    </nav>
  );
}
