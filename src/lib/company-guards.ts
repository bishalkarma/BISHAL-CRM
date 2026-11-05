/**
 * Pure customer validation & permission guards (BUILD 18.10):
 * - Case- and whitespace-normalized duplicate company name detection
 * - Option A customer deletion permissions (Admin any; Manager/Sales Rep own customer with 0 deals)
 */

export type CompanyDirectoryEntry = {
  id: string;
  name: string;
  area?: string | null;
  emirate?: string | null;
  owner?: string | null;
};

/**
 * Normalizes a customer name so case differences and extra spaces
 * ("  the baltimore   hotel villas ") cannot bypass duplicate checks.
 */
export function normalizeCompanyName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Merges local companies, prop names, and server directory entries into a single
 * de-duplicated directory keyed by company ID (or normalized name for bare strings).
 */
export function mergeCompanyDirectory(
  primary: readonly CompanyDirectoryEntry[],
  secondary: readonly CompanyDirectoryEntry[] = [],
  fallbackNames: readonly string[] = [],
): CompanyDirectoryEntry[] {
  const byId = new Map<string, CompanyDirectoryEntry>();
  const seenNormalized = new Set<string>();

  for (const entry of [...primary, ...secondary]) {
    if (!entry?.name?.trim()) continue;
    if (!byId.has(entry.id)) {
      byId.set(entry.id, entry);
      seenNormalized.add(normalizeCompanyName(entry.name));
    }
  }

  fallbackNames.forEach((rawName, idx) => {
    const norm = normalizeCompanyName(rawName ?? "");
    if (!norm || seenNormalized.has(norm)) return;
    seenNormalized.add(norm);
    byId.set(`__name_${idx}_${norm}`, {
      id: `__name_${idx}_${norm}`,
      name: rawName.trim(),
    });
  });

  return Array.from(byId.values());
}

/**
 * Returns the existing customer entry if `candidateName` matches any existing
 * customer in `directory` (excluding `excludeCompanyId` during edits).
 */
export function findDuplicateCompany(
  candidateName: string,
  directory: readonly CompanyDirectoryEntry[],
  excludeCompanyId?: string | null,
): CompanyDirectoryEntry | null {
  const normalizedCandidate = normalizeCompanyName(candidateName);
  if (!normalizedCandidate) return null;

  for (const entry of directory) {
    if (excludeCompanyId && entry.id === excludeCompanyId) continue;
    if (normalizeCompanyName(entry.name) === normalizedCandidate) {
      return entry;
    }
  }

  return null;
}

export type DeletePermissionInput = {
  role: string | null | undefined;
  isOwnerOrTeam: boolean;
  dealCount: number;
};

export type DeletePermissionResult = {
  canSeeButton: boolean;
  allowed: boolean;
  reason: string | null;
};

/**
 * BUILD 18.10 Option A customer delete policy:
 * - Admin: can delete any customer (with deal warning if dealCount > 0)
 * - Manager / Sales Rep: can delete their own (or team's, for Manager) customer when dealCount === 0
 * - Viewer / unauthenticated: never allowed
 */
export function evaluateCustomerDeletePermission({
  role,
  isOwnerOrTeam,
  dealCount,
}: DeletePermissionInput): DeletePermissionResult {
  const normalizedRole = (role ?? "").trim();

  if (normalizedRole === "Admin") {
    return { canSeeButton: true, allowed: true, reason: null };
  }

  if (normalizedRole === "Manager" || normalizedRole === "Sales Rep") {
    if (!isOwnerOrTeam) {
      return {
        canSeeButton: false,
        allowed: false,
        reason: "You can only delete customers assigned to you.",
      };
    }
    if (dealCount > 0) {
      return {
        canSeeButton: true,
        allowed: false,
        reason: `This customer has ${dealCount} linked ${
          dealCount === 1 ? "deal" : "deals"
        }. Only an Admin can delete a customer with existing deals.`,
      };
    }
    return { canSeeButton: true, allowed: true, reason: null };
  }

  return {
    canSeeButton: false,
    allowed: false,
    reason: "You do not have permission to delete customers.",
  };
}
