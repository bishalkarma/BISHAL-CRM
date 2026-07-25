/**
 * Multi-currency support.
 *
 * AED is the default. During setup (and later in Settings) a user can enable
 * additional currencies; deals then store their own `currency` plus the FX rate
 * captured at the time, so historical values stay accurate even when rates move.
 */

export type CurrencyCode =
  | "AED"
  | "USD"
  | "SAR"
  | "EUR"
  | "GBP"
  | "QAR"
  | "OMR"
  | "KWD"
  | "BHD"
  | "INR";

export type CurrencyDefinition = {
  code: CurrencyCode;
  name: string;
  symbol: string;
  /** Units of this currency per 1 AED (base). */
  perAed: number;
  decimals: number;
  region: string;
};

export const BASE_CURRENCY: CurrencyCode = "AED";

export const CURRENCIES: Record<CurrencyCode, CurrencyDefinition> = {
  AED: {
    code: "AED",
    name: "UAE Dirham",
    symbol: "AED",
    perAed: 1,
    decimals: 2,
    region: "United Arab Emirates",
  },
  USD: {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    perAed: 0.2723,
    decimals: 2,
    region: "United States",
  },
  SAR: {
    code: "SAR",
    name: "Saudi Riyal",
    symbol: "SR",
    perAed: 1.0213,
    decimals: 2,
    region: "Saudi Arabia",
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    perAed: 0.2512,
    decimals: 2,
    region: "Eurozone",
  },
  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    perAed: 0.2141,
    decimals: 2,
    region: "United Kingdom",
  },
  QAR: {
    code: "QAR",
    name: "Qatari Riyal",
    symbol: "QR",
    perAed: 0.9911,
    decimals: 2,
    region: "Qatar",
  },
  OMR: {
    code: "OMR",
    name: "Omani Rial",
    symbol: "OMR",
    perAed: 0.1048,
    decimals: 3,
    region: "Oman",
  },
  KWD: {
    code: "KWD",
    name: "Kuwaiti Dinar",
    symbol: "KD",
    perAed: 0.0834,
    decimals: 3,
    region: "Kuwait",
  },
  BHD: {
    code: "BHD",
    name: "Bahraini Dinar",
    symbol: "BD",
    perAed: 0.1026,
    decimals: 3,
    region: "Bahrain",
  },
  INR: {
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
    perAed: 23.87,
    decimals: 2,
    region: "India",
  },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);

/** Currencies switched on by default for a new workspace. */
export const DEFAULT_ENABLED_CURRENCIES: CurrencyCode[] = ["AED", "USD", "SAR"];

export const CURRENCY_STORAGE_KEY = "bishal-crm-currency";
export const ENABLED_CURRENCIES_STORAGE_KEY = "bishal-crm-enabled-currencies";

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && value in CURRENCIES;
}

/** Convert between any two supported currencies via the AED base. */
export function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
): number {
  if (from === to) return amount;
  const inAed = amount / CURRENCIES[from].perAed;
  return inAed * CURRENCIES[to].perAed;
}

export function formatMoney(
  amount: number,
  currency: CurrencyCode = BASE_CURRENCY,
  options: { compact?: boolean; withCode?: boolean } = {},
) {
  const { compact = false, withCode = true } = options;
  const def = CURRENCIES[currency];

  const formatted = new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(amount);

  return withCode ? `${def.symbol} ${formatted}` : formatted;
}
