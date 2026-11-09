/** Source/layout guards for BUILD 18.8 mobile CompanyDrawer Option B revamp. */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const drawer = readFileSync("src/components/companies/company-drawer.tsx", "utf8");
const transferHistory = readFileSync("src/components/companies/transfer-history.tsx", "utf8");

let passed = 0;
const check = (name: string, test: () => void) => {
  test();
  passed++;
  console.log(`  ok   ${name}`);
};

check("mobile (< lg) uses a single unified scroll container instead of stacked scroll panes", () => {
  assert.match(
    drawer,
    /className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:hidden"/,
  );
  // Ensure the mobile container itself has only 1 overflow-y-auto
  const mobileStart = drawer.indexOf("lg:hidden");
  const desktopStart = drawer.indexOf("lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]");
  assert.ok(mobileStart !== -1 && desktopStart > mobileStart);
  const mobileSection = drawer.slice(mobileStart - 80, desktopStart);
  assert.equal((mobileSection.match(/overflow-y-auto/g) ?? []).length, 1);
});

check("desktop (lg+) preserves the side-by-side two-column layout", () => {
  assert.match(
    drawer,
    /className="hidden min-h-0 flex-1 gap-0 overflow-hidden lg:grid lg:grid-cols-\[minmax\(0,1fr\)_minmax\(0,1fr\)\]"/,
  );
  const desktopStart = drawer.indexOf("lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]");
  const desktopSection = drawer.slice(desktopStart);
  assert.equal((desktopSection.match(/overflow-y-auto/g) ?? []).length, 2);
});

check("mobile top overview keeps SPANCOP, Status + Follow-up, Primary contact, and 2x2 Details grid intact", () => {
  const mobileStart = drawer.indexOf("lg:hidden");
  const desktopStart = drawer.indexOf("lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]");
  const mobileSection = drawer.slice(mobileStart, desktopStart);

  assert.match(mobileSection, /<SpancopStrip stage=\{company\.spancop\} \/>/);
  assert.match(mobileSection, /<FollowUpCell date=\{company\.nextFollowUp\} compact \/>/);
  assert.match(mobileSection, /tel:\$\{company\.phone\.replace/);
  assert.match(mobileSection, /https:\/\/wa\.me\/\$\{company\.phone\.replace/);
  assert.match(mobileSection, /mailto:\$\{company\.email\}/);
  assert.match(mobileSection, /<dl className="grid grid-cols-2 gap-1\.5">/);
  for (const label of ['label="Owner"', 'label="Lead source"', 'label="Location"', 'label="Last activity"']) {
    assert.ok(mobileSection.includes(label), `missing ${label} in mobile 2x2 grid`);
  }
});

check("Option B two-tab switcher defaults to activity and resets when company changes", () => {
  assert.match(drawer, /export const DEFAULT_MOBILE_COMPANY_TAB: MobileCompanyTab = "activity";/);
  assert.match(drawer, /setMobileTab\(DEFAULT_MOBILE_COMPANY_TAB\);\s*\}, \[customerId\]\)/);
  assert.match(drawer, /<TabsList className="grid h-9 w-full grid-cols-2 rounded-xl bg-secondary p-1">/);
  assert.match(drawer, /value="activity"/);
  assert.match(drawer, /value="history"/);
  assert.match(drawer, /Stage &amp; Owner History/);
});

check("mobile Activity tab renders DrawerJournal and History tab renders both Stage history and TransferHistory", () => {
  const mobileStart = drawer.indexOf("lg:hidden");
  const desktopStart = drawer.indexOf("lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]");
  const mobileSection = drawer.slice(mobileStart, desktopStart);

  const activityTabIdx = mobileSection.indexOf('<TabsContent value="activity"');
  const historyTabIdx = mobileSection.indexOf('<TabsContent value="history"');
  assert.ok(activityTabIdx !== -1 && historyTabIdx > activityTabIdx);

  const activityTab = mobileSection.slice(activityTabIdx, historyTabIdx);
  const historyTab = mobileSection.slice(historyTabIdx);

  assert.match(activityTab, /<DrawerJournal\s+activities=\{companyActivities\}\s+scope="company"\s+companyId=\{company\.id\}\s*\/>/);
  assert.match(historyTab, /renderStageHistoryList\(true\)/);
  assert.match(historyTab, /<TransferHistory[\s\S]*showEmpty[\s\S]*compact/);
});

check("TransferHistory shares single fetch from CompanyDrawer and supports compact empty state", () => {
  assert.match(drawer, /\[open, customerId, companyOwner\]/);
  assert.match(transferHistory, /showEmpty = false/);
  assert.match(transferHistory, /compact = false/);
  assert.match(transferHistory, /No ownership transfers recorded yet\./);
});

check("Edit company modal and mobile Close button remain wired", () => {
  assert.match(drawer, /setEditing\(true\)/);
  assert.match(drawer, /<NewCompanyDialog[\s\S]*open=\{editing\}/);
  assert.match(drawer, /onClick=\{\(\) => onOpenChange\(false\)\}/);
});

console.log(`\n${passed} passed, 0 failed`);
