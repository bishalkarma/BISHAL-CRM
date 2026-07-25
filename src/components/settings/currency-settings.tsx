"use client";

import { Check, Coins, Star } from "lucide-react";
import { CURRENCY_LIST, BASE_CURRENCY } from "@/lib/currency";
import { useCurrency } from "@/components/providers/currency-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

        {/* Enabled currencies */}
        <div>
          <div className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Enabled currencies
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {CURRENCY_LIST.map((currency) => {
              const isBase = currency.code === BASE_CURRENCY;
              const isOn = enabled.includes(currency.code);
              return (
                <button
                  key={currency.code}
                  onClick={() => toggleEnabled(currency.code)}
                  disabled={isBase}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200",
                    isOn
                      ? "border-accent/50 bg-accent/[0.05]"
                      : "border-border hover:border-accent/30 hover:bg-secondary/60",
                    isBase && "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                      isOn
                        ? "bg-accent/15 text-accent"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {currency.symbol}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">
                        {currency.code}
                      </span>
                      {isBase && (
                        <Badge variant="accent" className="gap-1 px-1.5 py-0">
                          <Star className="size-2.5" />
                          Base
                        </Badge>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {currency.name} · {currency.region}
                    </span>
                  </span>
                  {isOn && <Check className="size-4 shrink-0 text-accent" />}
                </button>
              );
            })}
          </div>
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
