"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { THEMES } from "@/lib/themes";
import { useAccentTheme } from "@/components/theme/theme-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "light", label: "Light", icon: Sun, hint: "Bright and crisp" },
  { id: "dark", label: "Dark", icon: Moon, hint: "Easy on the eyes" },
  { id: "system", label: "Automatic", icon: Monitor, hint: "Match device" },
] as const;

export function AppearanceSettings() {
  const { accent, setAccent } = useAccentTheme();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Display mode</CardTitle>
          <CardDescription>
            Choose how Bishal Sales CRM looks on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const active = mounted && theme === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setTheme(mode.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    active
                      ? "border-accent bg-accent/[0.07] shadow-[var(--shadow-soft)]"
                      : "border-border hover:border-accent/40 hover:bg-secondary/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {mode.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {mode.hint}
                    </span>
                  </span>
                  {active && <Check className="size-4 shrink-0 text-accent" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color theme</CardTitle>
          <CardDescription>
            Six curated palettes. Your choice is saved to this browser and
            applies instantly across the whole app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {THEMES.map((item) => {
              const active = accent === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setAccent(item.id)}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    active
                      ? "border-accent shadow-[var(--shadow-glow)]"
                      : "border-border hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[var(--shadow-card)]",
                  )}
                >
                  {/* Mini UI preview */}
                  <div
                    className="mb-3 flex h-[74px] gap-1.5 overflow-hidden rounded-xl p-2"
                    style={{ background: item.swatch.primary }}
                  >
                    <div className="flex w-[26%] flex-col gap-1">
                      <span
                        className="h-2 rounded-full"
                        style={{ background: item.swatch.accent }}
                      />
                      <span className="h-1.5 rounded-full bg-white/25" />
                      <span className="h-1.5 rounded-full bg-white/20" />
                      <span className="h-1.5 rounded-full bg-white/15" />
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5 rounded-lg bg-white/95 p-1.5 dark:bg-white/90">
                      <span
                        className="h-2 w-1/2 rounded-full"
                        style={{ background: item.swatch.accent }}
                      />
                      <div className="flex flex-1 gap-1">
                        <span className="flex-1 rounded bg-black/10" />
                        <span
                          className="flex-1 rounded"
                          style={{
                            background: item.swatch.accent,
                            opacity: 0.35,
                          }}
                        />
                        <span className="flex-1 rounded bg-black/[0.07]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {item.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                    {active && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {item.bestFor}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
