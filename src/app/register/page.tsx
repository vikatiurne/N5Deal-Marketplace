import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { localizePath } from "@/i18n/config";
import { getLocale, getT } from "@/i18n/server";
import { getSession } from "@/lib/auth/guards";
import { ROLE_HOME } from "@/lib/auth/types";

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t("auth.register.title"),
    description: t("auth.register.subtitle"),
  };
}

export default async function RegisterPage() {
  const session = await getSession();
  if (session && session.status === "ACTIVE") {
    const locale = await getLocale();
    redirect(localizePath(locale, ROLE_HOME[session.role]));
  }
  const t = await getT();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("auth.register.title")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("auth.register.subtitle")}
      </p>
      <RegisterForm />
    </div>
  );
}
