"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";

const THEMES: Theme[] = ["light", "dark", "system"];
const ICONS: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const idx = THEMES.indexOf(theme);
    setTheme(THEMES[(idx + 1) % THEMES.length]);
  };

  const Icon = ICONS[theme];

  return (
    <button
      onClick={cycle}
      className="flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors duration-150"
      title={theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
