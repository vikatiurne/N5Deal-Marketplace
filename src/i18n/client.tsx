"use client";

import { createContext, useContext, useMemo } from "react";

import { localizePath, type Locale } from "./config";
import { createT, type TFunction } from "./core";

interface I18nValue {
  locale: Locale;
  t: TFunction;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({ locale, t: createT(locale) }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

export function useT(): TFunction {
  return useI18n().t;
}

/** Locale-aware link builder for client components. */
export function useLocaleHref(): (path: string) => string {
  const { locale } = useI18n();
  return (path) => localizePath(locale, path);
}
