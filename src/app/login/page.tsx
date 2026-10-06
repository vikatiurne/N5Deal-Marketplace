import { redirect } from "next/navigation";

import { DemoCredentials } from "@/components/auth/DemoCredentials";
import { LoginForm } from "@/components/auth/LoginForm";
import { localizePath } from "@/i18n/config";
import { getLocale, getT } from "@/i18n/server";
import { getSession } from "@/lib/auth/guards";
import { ROLE_HOME } from "@/lib/auth/types";
import { DEMO_ACCOUNTS } from "@/lib/auth/demoAccounts";
import { findStatusesByEmails } from "@/lib/db/repositories/users";

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t("nav.signIn"),
    description: t("auth.login.subtitle"),
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await getSession();
  if (session && session.status === "ACTIVE") {
    const params = await searchParams;
    const locale = await getLocale();
    redirect(params.next ?? localizePath(locale, ROLE_HOME[session.role]));
  }

  const statuses = await findStatusesByEmails(
    DEMO_ACCOUNTS.map((account) => account.email),
  );
  const t = await getT();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-4">
        <h1 className="text-2xl font-semibold">{t("nav.signIn")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.login.subtitle")}
        </p>
        <LoginForm />
      </section>
      <section className="flex min-w-0 flex-col gap-4">
        <DemoCredentials statuses={statuses} />
      </section>
    </div>
  );
}
