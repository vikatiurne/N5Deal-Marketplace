import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/i18n/client";
import { getLocale, getT } from "@/i18n/server";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: {
      default: t("meta.title.default"),
      template: "%s · N5Deal",
    },
    description: t("meta.description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className="dark">
      <body className="flex min-h-screen flex-col antialiased">
        <I18nProvider locale={locale}>
          <SiteHeader />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <SiteFooter />
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
