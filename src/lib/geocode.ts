/**
 * Turns a raw reverse-geocode response into the two things the company form
 * actually needs: an area name for the Location field, and an emirate.
 */

import { EMIRATES, type Emirate } from "./companies";

export type GeocodeResult = {
  /** Neighbourhood-level name, e.g. "Palm Jumeirah". */
  area: string | null;
  /** Matched to our 7 emirates, or null if outside the UAE. */
  emirate: Emirate | null;
  /** Fuller label for display, e.g. "Palm Jumeirah, Dubai". */
  label: string | null;
  failed?: boolean;
};

type NominatimAddress = Record<string, string | undefined>;

/**
 * Nominatim spreads the useful name across different keys depending on how
 * densely mapped the location is, so try them from most to least specific.
 */
const AREA_KEYS = [
  "neighbourhood",
  "suburb",
  "quarter",
  "residential",
  "city_district",
  "village",
  "town",
  "hamlet",
  "municipality",
] as const;

/** UAE emirate names as they appear in OSM, mapped to our canonical list. */
const EMIRATE_ALIASES: Record<string, Emirate> = {
  dubai: "Dubai",
  dubayy: "Dubai",
  "abu dhabi": "Abu Dhabi",
  "abu zaby": "Abu Dhabi",
  "abū ẓaby": "Abu Dhabi",
  sharjah: "Sharjah",
  "ash shariqah": "Sharjah",
  ajman: "Ajman",
  "ras al khaimah": "Ras Al Khaimah",
  "ra's al khaymah": "Ras Al Khaimah",
  fujairah: "Fujairah",
  "al fujayrah": "Fujairah",
  "umm al quwain": "Umm Al Quwain",
  "umm al qaywayn": "Umm Al Quwain",
};

function matchEmirate(value: string | undefined): Emirate | null {
  if (!value) return null;
  const key = value.toLowerCase().replace(/^emirate of\s+/, "").trim();
  if (EMIRATE_ALIASES[key]) return EMIRATE_ALIASES[key];
  // Fall back to a direct match against our own list.
  return EMIRATES.find((e) => e.toLowerCase() === key) ?? null;
}

export function parseReverseGeocode(data: {
  address?: NominatimAddress;
  name?: string;
  display_name?: string;
}): GeocodeResult {
  const address = data.address ?? {};

  let area: string | null = null;
  for (const key of AREA_KEYS) {
    const value = address[key];
    if (value && value.trim()) {
      area = value.trim();
      break;
    }
  }

  // Some pins resolve to a named place (a hotel, a mall) with no
  // neighbourhood — that name is more useful than nothing.
  if (!area && data.name?.trim()) area = data.name.trim();
  if (!area && address.road?.trim()) area = address.road.trim();

  const emirate =
    matchEmirate(address.state) ??
    matchEmirate(address.county) ??
    matchEmirate(address.city);

  // Avoid "Dubai, Dubai" when the area and emirate are the same place.
  const cityName = address.city?.trim();
  if (!area && cityName) area = cityName;

  const label =
    area && emirate && area.toLowerCase() !== emirate.toLowerCase()
      ? `${area}, ${emirate}`
      : (area ?? emirate ?? null);

  return { area, emirate, label };
}
