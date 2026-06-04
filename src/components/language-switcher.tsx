"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useI18n, LOCALES, type LocaleCode } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors duration-150"
        title="Language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{LOCALES.find(l => l.code === locale)?.name}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-[100] min-w-[140px] rounded-xl overflow-hidden shadow-lg animate-scale-in"
          style={{
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "0.5px solid var(--border)",
          }}
        >
          {LOCALES.map(loc => (
            <button
              key={loc.code}
              onClick={() => { setLocale(loc.code as LocaleCode); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors duration-100 ${
                locale === loc.code
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted/60 text-foreground"
              }`}
            >
              <span>{loc.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
