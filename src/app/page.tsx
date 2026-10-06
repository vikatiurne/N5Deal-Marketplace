import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { localizePath } from "@/i18n/config";
import { type MessageKey } from "@/i18n/core";
import { getLocale, getT } from "@/i18n/server";
import { getSession } from "@/lib/auth/guards";
import { ROLE_HOME } from "@/lib/auth/types";

interface RoleCard {
  title: MessageKey;
  description: MessageKey;
  href: string;
  cta: MessageKey;
}

const ROLES: RoleCard[] = [
  {
    title: "home.roleBuyerTitle",
    description: "home.roleBuyerDescription",
    href: "/assets",
    cta: "home.roleBuyerCta",
  },
  {
    title: "home.roleSellerTitle",
    description: "home.roleSellerDescription",
    href: "/seller",
    cta: "home.roleSellerCta",
  },
  {
    title: "home.roleManagerTitle",
    description: "home.roleManagerDescription",
    href: "/manager",
    cta: "home.roleManagerCta",
  },
];

export default async function Home() {
  // Logged-in users go straight to their role home (task 03, deliverable 7).
  const session = await getSession();
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const href = (path: string) => localizePath(locale, path);
  if (session && session.status === "ACTIVE") {
    redirect(localizePath(locale, ROLE_HOME[session.role]));
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col items-start gap-4">
        <Badge variant="outline" className="border-primary/40 text-primary">
          {t("home.badge")}
        </Badge>
        <h1 className="max-w-2xl text-4xl font-semibold sm:text-5xl">
          {t("home.title")}
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          {t("home.subtitle")}
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href={href("/assets")}>{t("home.browseAssets")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={href("/login")}>{t("home.login")}</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={href("/register")}>{t("home.createAccount")}</Link>
          </Button>
        </div>
      </section>

      <section
        aria-label={t("home.rolesLabel")}
        className="grid gap-4 sm:grid-cols-3"
      >
        {ROLES.map((role) => (
          <Card key={role.title} className="bg-surface">
            <CardHeader>
              <CardTitle className="text-lg">{t(role.title)}</CardTitle>
              <CardDescription>{t(role.description)}</CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <Link
                href={href(role.href)}
                className="text-sm font-medium text-primary hover:underline hover:underline-offset-4"
              >
                {t(role.cta)} →
              </Link>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
