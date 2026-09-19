"use client";

import { Coins } from "lucide-react";
import { CURRENCY_LIST, BASE_CURRENCY } from "@/lib/currency";
import { useCurrency } from "@/components/providers/currency-provider";
import type { CurrencyCode } from "@/lib/currency";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CurrencySettings() {
  const { display, setDisplay, enabled, toggleEnabled } = useCurrency();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="size-4 text-accent" />
          Currencies
        </CardTitle>
        <CardDescription>
          <strong className="font-medium text-foreground">AED</strong> is your
          base currency — every deal is reported against it and it can&apos;t be
          switched off. Enable any others you trade in, then pick which one
          totals are displayed in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Display currency */}
        <div>
          <div className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Display totals in
          </div>
          <div className="flex flex-wrap gap-1.5">
            {enabled.map((code) => (
              <button
                key={code}
                onClick={() => setDisplay(code)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200",
                  display === code
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:border-accent/40 hover:bg-secondary",
                )}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Enabled currencies - Dropdown */}
        <div>
          <div className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Enabled currencies
          </div>
          <select
            value={display}
            onChange={(e) => setDisplay(e.target.value as CurrencyCode)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            {enabled.map((code) => {
              const currency = CURRENCY_LIST.find(c => c.code === code);
              return (
                <option key={code} value={code}>
                  {code} - {currency?.name} ({currency?.region})
                </option>
              );
            })}
          </select>
        </div>

        <p className="rounded-lg bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
          Each deal stores its own currency plus the exchange rate captured when
          it was created, so historical values stay accurate even when rates
          move. Live FX rates arrive with the Supabase backend.
        </p>
      </CardContent>
    </Card>
  );
}
