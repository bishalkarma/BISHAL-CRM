/**
 * Free-text fields that should remember what you typed last time.
 *
 * Cluster and Category are both open-ended: a HORECA book contains hotel
 * groups and product categories nobody can enumerate up front. Both were
 * offered as a fixed list written into the source, so a value you typed was
 * saved on the record but never appeared in the dropdown again — you had to
 * retype it for every customer in the same group.
 *
 * These helpers build the list from what is actually in the database, so it
 * grows as the CRM is used. The bundled suggestions stay, purely so a brand
 * new account is not staring at an empty box.
 */

/**
 * Merge saved values with suggestions.
 *
 * Case-insensitive de-duplication, keeping whichever spelling was saved
 * first — "Emaar Hospitality" and "emaar hospitality" are one entry, and the
 * user's own capitalisation wins over the bundled suggestion.
 */
export function mergeOptions(
  saved: (string | null | undefined)[],
  suggestions: readonly string[] = [],
): string[] {
  const seen = new Map<string, string>();

  const add = (raw: string | null | undefined) => {
    const value = raw?.trim();
    if (!value) return;
    const key = value.toLowerCase();
    if (!seen.has(key)) seen.set(key, value);
  };

  // Saved values first so real data defines the spelling.
  saved.forEach(add);
  suggestions.forEach(add);

  return [...seen.values()].sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" }),
  );
}

/** True when this value is not already in the list, ignoring case and spacing. */
export function isNewOption(value: string, options: string[]) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !options.some((o) => o.toLowerCase() === trimmed.toLowerCase());
}
