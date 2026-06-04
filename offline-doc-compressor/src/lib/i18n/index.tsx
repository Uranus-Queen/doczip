"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import type { LocaleKeys, Locale } from "./locales/en";
import en from "./locales/en";
import zh from "./locales/zh";
import hi from "./locales/hi";
import es from "./locales/es";
import ar from "./locales/ar";
import fr from "./locales/fr";
import pt from "./locales/pt";
import ru from "./locales/ru";
import bn from "./locales/bn";
import de from "./locales/de";

export type LocaleCode = "en" | "zh" | "hi" | "es" | "ar" | "fr" | "pt" | "ru" | "bn" | "de";

export interface LocaleMeta {
  code: LocaleCode;
  name: string;       // native name
  dir: "ltr" | "rtl";
}

export const LOCALES: LocaleMeta[] = [
  { code: "en", name: "English",    dir: "ltr" },
  { code: "zh", name: "中文",       dir: "ltr" },
  { code: "hi", name: "हिन्दी",       dir: "ltr" },
  { code: "es", name: "Español",    dir: "ltr" },
  { code: "ar", name: "العربية",     dir: "rtl" },
  { code: "fr", name: "Français",   dir: "ltr" },
  { code: "pt", name: "Português",  dir: "ltr" },
  { code: "ru", name: "Русский",    dir: "ltr" },
  { code: "bn", name: "বাংলা",        dir: "ltr" },
  { code: "de", name: "Deutsch",    dir: "ltr" },
];

const TRANSLATIONS: Record<LocaleCode, Locale> = { en, zh, hi, es, ar, fr, pt, ru, bn, de };

const STORAGE_KEY = "doccompress-locale";

/** Match browser languages to supported locale codes */
function detectLocale(): LocaleCode {
  // 1. Check localStorage
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in TRANSLATIONS) return stored as LocaleCode;
  }

  // 2. Check navigator.languages
  if (typeof navigator !== "undefined") {
    const supported = new Set(Object.keys(TRANSLATIONS));
    for (const lang of navigator.languages) {
      const base = lang.split("-")[0].toLowerCase();
      if (supported.has(base)) return base as LocaleCode;
      // zh-TW/zh-HK → zh, pt-BR → pt, etc.
      if (lang.toLowerCase().startsWith("zh")) return "zh";
      if (lang.toLowerCase().startsWith("pt")) return "pt";
    }
  }

  // 3. Default
  return "zh";
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  );
}

interface I18nContextValue {
  locale: LocaleCode;
  setLocale: (code: LocaleCode) => void;
  t: (key: LocaleKeys, params?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(detectLocale);

  const setLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  // Sync <html lang> and dir
  useEffect(() => {
    const meta = LOCALES.find(l => l.code === locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = meta?.dir ?? "ltr";
  }, [locale]);

  const t = useCallback((key: LocaleKeys, params?: Record<string, string | number>): string => {
    const dict = TRANSLATIONS[locale] ?? TRANSLATIONS.en;
    const template = (dict[key] as string) ?? (en[key] as string) ?? key;
    return interpolate(template, params);
  }, [locale]);

  const dir = useMemo(() => LOCALES.find(l => l.code === locale)?.dir ?? "ltr", [locale]);

  const value = useMemo(() => ({ locale, setLocale, t, dir }), [locale, setLocale, t, dir]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
