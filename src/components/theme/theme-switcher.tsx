"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { THEMES } from "@/lib/themes";
import { useAccentTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "Auto", icon: Monitor },
] as const;

/** Compact light/dark toggle for the top bar. */
export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle dark mode"
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative overflow-hidden"
    >
      {mounted ? (
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={{ y: 12, opacity: 0, rotate: -30 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center"
        >
          {isDark ? <Moon /> : <Sun />}
        </motion.span>
      ) : (
        <Sun />
      )}
      <span className="sr-only">
        Current theme: {mounted ? theme : "loading"}
      </span>
    </Button>
  );
}

/** Full palette picker — 6 accent themes + light/dark/auto. */
export function ThemeSwitcher({ align = "end" }: { align?: "start" | "end" }) {
  const { accent, setAccent } = useAccentTheme();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Change theme"
          title="Change theme"
        >
          <Palette />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-[290px] p-2">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1.5 px-1 pb-2">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const active = mounted && theme === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setTheme(mode.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border border-transparent px-2 py-2.5 text-xs font-medium transition-all duration-200",
                  active
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                <Icon className="size-4" />
                {mode.label}
              </button>
            );
          })}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color theme</DropdownMenuLabel>
        <div className="max-h-[320px] space-y-1 overflow-y-auto px-1 pb-1 scrollbar-thin">
          {THEMES.map((item) => {
            const active = accent === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAccent(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-200",
                  active ? "bg-secondary" : "hover:bg-secondary/70",
                )}
              >
                <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg shadow-[var(--shadow-soft)]">
                  <span
                    className="absolute inset-0 rounded-lg"
                    style={{ background: item.swatch.primary }}
                  />
                  <span
                    className="absolute bottom-0 right-0 size-4 rounded-br-lg rounded-tl-lg"
                    style={{ background: item.swatch.accent }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                {active && <Check className="size-4 shrink-0 text-accent" />}
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
