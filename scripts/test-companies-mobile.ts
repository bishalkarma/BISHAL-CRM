/** Source/layout guards, not a substitute for mobile browser testing. */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const mobile = readFileSync("src/components/companies/mobile-company-table.tsx", "utf8");
const desktop = readFileSync("src/components/companies/company-table.tsx", "utf8");
const view = readFileSync("src/components/companies/companies-view.tsx", "utf8");
const pagination = readFileSync("src/components/ui/pagination.tsx", "utf8");
const snapshot = readFileSync("src/components/companies/spancop-funnel.tsx", "utf8");
let passed = 0;
const check = (name: string, test: () => void) => {
  test(); passed++; console.log(`  ok   ${name}`);
};
const columns = [...mobile.matchAll(/label: "([^"]+)", width: (\d+)/g)].map(match => ({ label: match[1], width: Number(match[2]) }));

check("all eight fields are retained in the approved mobile order", () => {
  assert.deepEqual(columns.map(column => column.label), ["Company", "Business", "Stage", "Follow-up", "Type", "Lead", "Alert", "Owner"]);
});
check("column widths are fixed and fit the first three columns in a 390px phone", () => {
  assert.equal(columns[0].width, 148);
  assert.ok(columns.slice(0, 3).reduce((sum, column) => sum + column.width, 0) <= 390 - 48);
});
check("narrow phones and tablets scroll the table rather than stacking its cells", () => {
  const total = columns.reduce((sum, column) => sum + column.width, 0);
  assert.equal(total, 852);
  assert.match(mobile, /table-fixed/);
  assert.match(mobile, /minWidth: COLUMNS\.reduce/);
  for (const width of [320, 375, 390, 414, 768]) assert.ok(total > width - 32);
});
check("scrolling is confined to a viewport-width accessible region", () => {
  assert.match(mobile, /role="region"/);
  assert.match(mobile, /tabIndex=\{0\}/);
  assert.match(mobile, /w-full max-w-full overflow-x-auto/);
});
check("table has a caption, column headers, and company row headers", () => {
  for (const element of ["<table", "<caption", "<colgroup", "<thead", "<tbody", 'scope="col"', 'scope="row"']) assert.ok(mobile.includes(element), element);
});
check("company header and row cells stay pinned with opaque backgrounds", () => {
  assert.equal((mobile.match(/sticky left-0/g) ?? []).length, 2);
  assert.match(mobile, /bg-secondary/);
  assert.match(mobile, /scope="row" className="sticky left-0 z-10[^\n]*bg-card/);
});
check("long company names wrap within the pinned column", () => {
  assert.match(mobile, /line-clamp-2 break-words/);
  assert.match(mobile, /title=\{company.name\}/);
});
check("mobile cells use live records and existing field helpers", () => {
  for (const field of ["company.business", "company.type", "company.spancop", "company.leadStatus", "company.nextFollowUp", "company.owner"]) assert.ok(mobile.includes(field), field);
  assert.match(mobile, /<FollowUpCell/);
  assert.match(mobile, /alertFor\(company\)/);
  assert.doesNotMatch(mobile, /from ["'][^"']*demo-data/);
});
check("company and remaining cells open the existing company details", () => {
  assert.equal((mobile.match(/onClick=\{\(\) => onOpen\(company\)\}/g) ?? []).length, 2);
  assert.match(mobile, /focus-visible:outline/);
});
check("compact rows do not recreate per-company cards", () => {
  assert.match(mobile, /min-h-\[58px\]/);
  assert.match(mobile, /<tr key=\{company.id\}/);
  assert.doesNotMatch(mobile, /<Card|<motion\.li/);
});
check("desktop renderer and shared loading/empty states are retained", () => {
  assert.match(desktop, /<MobileCompanyTable companies=\{companies\} onOpen=\{onOpen\}/);
  assert.match(desktop, /hidden w-full[^\n]*xl:block/);
  assert.match(desktop, /if \(loading\)/);
  assert.match(desktop, /No companies match your filters/);
});
check("mobile snapshot has seven columns and accessible stage labels", () => {
  assert.match(snapshot, /grid-cols-7/);
  assert.match(snapshot, /aria-label=\{`\$\{stage.label\}: \$\{count\} companies`\}/);
  assert.match(snapshot, /onClick=\{\(\) => onToggleStage\(stage.id\)\}/);
});
check("compact pagination is opt-in only for Companies", () => {
  assert.match(pagination, /compactMobile = false/);
  assert.match(view, /label="companies"\s+compactMobile/);
  assert.match(pagination, /compactMobile && "hidden sm:inline-flex"/);
});
check("existing filtering, pagination, and drawer wiring are intact", () => {
  for (const text of ["companies={pagedCompanies}", "onOpen={openCompany}", "<CompanyDrawer", "onPageChange={setPage}", "setFilters"]) assert.ok(view.includes(text), text);
});
check("mobile table makes no database or data-provider writes", () => {
  assert.doesNotMatch(mobile, /supabase|\.insert\(|\.update\(|\.delete\(|fetch\(/);
});
console.log(`\n${passed} passed, 0 failed\n`);
