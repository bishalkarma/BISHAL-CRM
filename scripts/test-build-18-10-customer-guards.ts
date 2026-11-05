/**
 * BUILD 18.10 Verification Suite:
 * 1. Fixed CompanyDrawer card height across mobile tabs + pinned Close bar + 1-line disabled Email button
 * 2. Option A Delete Customer permission logic + safe FK cascade order in /api/companies/[id]
 * 3. Global normalized Duplicate Customer Name detection & hard block across create, edit, and CSV import
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  evaluateCustomerDeletePermission,
  findDuplicateCompany,
  mergeCompanyDirectory,
  normalizeCompanyName,
} from "../src/lib/company-guards";
import { buildImportPreview, buildSampleCsv } from "../src/lib/csv-import";

const ROOT = process.cwd();

let passed = 0;
function check(label: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`✓ ${label}`);
}

check("normalizeCompanyName trims and collapses internal whitespace case-insensitively", () => {
  assert.equal(normalizeCompanyName("  Atlantis   The  Palm "), "atlantis the palm");
  assert.equal(normalizeCompanyName("ATLANTIS THE PALM"), "atlantis the palm");
  assert.equal(normalizeCompanyName("   "), "");
});

check("mergeCompanyDirectory + findDuplicateCompany catch cross-rep duplicates and allow self-edit", () => {
  const dir = mergeCompanyDirectory(
    [
      {
        id: "C-101",
        name: "Atlantis The Palm",
        area: "Palm Jumeirah",
        emirate: "Dubai",
        owner: "Rami Haddad",
      },
      {
        id: "C-102",
        name: "Jumeirah Al Naseem",
        area: "Umm Suqeim",
        emirate: "Dubai",
        owner: "Tariq Mansoor",
      },
    ],
    [],
    ["Legacy Resort"],
  );

  // Exact match
  const exact = findDuplicateCompany("Atlantis The Palm", dir);
  assert.equal(exact?.id, "C-101");
  assert.equal(exact?.owner, "Rami Haddad");

  // Extra spaces + different case
  const spaced = findDuplicateCompany("  atlantis   THE   palm  ", dir);
  assert.equal(spaced?.id, "C-101");

  // Fallback string list match
  const fallback = findDuplicateCompany("legacy   resort", dir);
  assert.equal(fallback?.name, "Legacy Resort");

  // Editing C-101 itself must NOT flag itself as duplicate
  const selfEdit = findDuplicateCompany("Atlantis  The Palm", dir, "C-101");
  assert.equal(selfEdit, null);

  // Editing C-101 into C-102's name MUST flag C-102 as duplicate
  const renameCollision = findDuplicateCompany("jumeirah al naseem", dir, "C-101");
  assert.equal(renameCollision?.id, "C-102");
});

check("Option A evaluateCustomerDeletePermission enforces Admin, Manager, Sales Rep, and Viewer rules", () => {
  // Admin: can delete any customer regardless of deals
  assert.deepEqual(
    evaluateCustomerDeletePermission({ role: "Admin", isOwnerOrTeam: false, dealCount: 0 }),
    { canSeeButton: true, allowed: true, reason: null },
  );
  assert.deepEqual(
    evaluateCustomerDeletePermission({ role: "Admin", isOwnerOrTeam: false, dealCount: 4 }),
    { canSeeButton: true, allowed: true, reason: null },
  );

  // Manager: own/team with 0 deals -> allowed; with deals -> visible but blocked with explanation; non-team -> hidden
  const mgrZero = evaluateCustomerDeletePermission({
    role: "Manager",
    isOwnerOrTeam: true,
    dealCount: 0,
  });
  assert.equal(mgrZero.canSeeButton, true);
  assert.equal(mgrZero.allowed, true);

  const mgrDeals = evaluateCustomerDeletePermission({
    role: "Manager",
    isOwnerOrTeam: true,
    dealCount: 2,
  });
  assert.equal(mgrDeals.canSeeButton, true);
  assert.equal(mgrDeals.allowed, false);
  assert.ok(mgrDeals.reason?.includes("Only an Admin"));

  const mgrOther = evaluateCustomerDeletePermission({
    role: "Manager",
    isOwnerOrTeam: false,
    dealCount: 0,
  });
  assert.equal(mgrOther.canSeeButton, false);
  assert.equal(mgrOther.allowed, false);

  // Sales Rep: own with 0 deals -> allowed; own with deals -> visible but blocked; other's -> hidden
  const repZero = evaluateCustomerDeletePermission({
    role: "Sales Rep",
    isOwnerOrTeam: true,
    dealCount: 0,
  });
  assert.equal(repZero.canSeeButton, true);
  assert.equal(repZero.allowed, true);

  const repDeals = evaluateCustomerDeletePermission({
    role: "Sales Rep",
    isOwnerOrTeam: true,
    dealCount: 1,
  });
  assert.equal(repDeals.canSeeButton, true);
  assert.equal(repDeals.allowed, false);
  assert.ok(repDeals.reason?.includes("Only an Admin"));

  const repOther = evaluateCustomerDeletePermission({
    role: "Sales Rep",
    isOwnerOrTeam: false,
    dealCount: 0,
  });
  assert.equal(repOther.canSeeButton, false);
  assert.equal(repOther.allowed, false);

  // Viewer: never allowed or visible
  const viewer = evaluateCustomerDeletePermission({
    role: "Viewer",
    isOwnerOrTeam: true,
    dealCount: 0,
  });
  assert.equal(viewer.canSeeButton, false);
  assert.equal(viewer.allowed, false);
});

check("CSV import blocks normalized extra-space and mixed-case duplicates", () => {
  const sample = buildSampleCsv();
  const lines = sample.trim().split("\n");
  // First sample row is "Grand Hyatt Dubai" — pass an extra-spaced existing name
  const preview = buildImportPreview(lines.slice(0, 3).join("\n"), [
    "  grand   HYATT dubai ",
  ]);
  assert.ok(
    preview.rows[0].issues.some((i) => i.message.includes("already exists")),
    "Expected normalized duplicate row to be rejected in CSV preview",
  );
  assert.equal(preview.rows[0].company, null);
  assert.equal(preview.validCount, 1);
  assert.equal(preview.errorCount, 1);
});

check("CompanyDrawer locks viewport height, pins mobile Close bar, fixes disabled Email button, and wires Delete modal", () => {
  const drawerSrc = fs.readFileSync(
    path.join(ROOT, "src/components/companies/company-drawer.tsx"),
    "utf8",
  );

  assert.ok(
    drawerSrc.includes("h-[88dvh] max-h-[88dvh]") &&
      drawerSrc.includes("lg:h-[86vh] lg:max-h-[86vh]"),
    "CompanyDrawer DialogContent must lock fixed mobile/desktop viewport heights",
  );
  assert.ok(
    drawerSrc.includes(
      'className="shrink-0 border-t border-border bg-popover/95 px-3.5 py-2.5 lg:hidden"',
    ),
    "Mobile Close bar must be pinned outside scroll container",
  );
  assert.ok(
    !drawerSrc.includes("<span>\n                    <Mail />"),
    "Disabled Email button must not wrap <Mail /> in an extra <span> via asChild",
  );
  assert.ok(
    drawerSrc.includes("Delete customer?") &&
      drawerSrc.includes("await deleteCompany(company.id)"),
    "CompanyDrawer must render Delete confirmation modal and invoke deleteCompany",
  );
});

check("Server API routes safely delete non-cascading FK tables first and expose authenticated global directory", () => {
  const deleteRouteSrc = fs.readFileSync(
    path.join(ROOT, "src/app/api/companies/[id]/route.ts"),
    "utf8",
  );
  const notifIdx = deleteRouteSrc.indexOf('.from("notifications")');
  const transferIdx = deleteRouteSrc.indexOf('.from("transfer_history")');
  const companyDeleteIdx = deleteRouteSrc.lastIndexOf('.from("companies")');

  assert.ok(notifIdx > 0, "Delete route must clean up notifications");
  assert.ok(transferIdx > 0, "Delete route must clean up transfer_history");
  assert.ok(
    notifIdx < companyDeleteIdx && transferIdx < companyDeleteIdx,
    "notifications and transfer_history must be deleted before companies row",
  );

  const dirRouteSrc = fs.readFileSync(
    path.join(ROOT, "src/app/api/companies/directory/route.ts"),
    "utf8",
  );
  assert.ok(
    dirRouteSrc.includes("supabaseAdmin") &&
      dirRouteSrc.includes('.select("id, name, area, emirate, owner")'),
    "Directory route must return global company identities via supabaseAdmin",
  );
});

check("NewCompanyDialog & ImportDialog fetch global directory and hard-lock duplicate names", () => {
  const newCompanySrc = fs.readFileSync(
    path.join(ROOT, "src/components/companies/new-company-dialog.tsx"),
    "utf8",
  );
  assert.ok(newCompanySrc.includes('fetch("/api/companies/directory"'));
  assert.ok(newCompanySrc.includes("Duplicate customer name"));
  assert.ok(newCompanySrc.includes("already exists"));
  assert.ok(!newCompanySrc.includes("in ZEST CRM"));
  assert.ok(newCompanySrc.includes("Already Exists (Blocked)"));
  assert.ok(
    newCompanySrc.includes("disabled={duplicate || (touched && !valid)}"),
    "Submit button must lock immediately when duplicate is true",
  );

  const importSrc = fs.readFileSync(
    path.join(ROOT, "src/components/companies/import-dialog.tsx"),
    "utf8",
  );
  assert.ok(importSrc.includes('fetch("/api/companies/directory"'));
  assert.ok(importSrc.includes("mergeCompanyDirectory"));
});

console.log(`\nBUILD 18.10 customer guards suite passed (${passed}/7 checks).`);
