/** Source/layout and calculation guards for BUILD 18.7 dashboard tile step-by-step limits. */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { DEALS } from "../src/lib/deals";
import {
  expectedToClose,
  productsByCustomer,
  samplesAwaiting,
  topProducts,
} from "../src/lib/dashboard-metrics";

const topProductsSource = readFileSync("src/components/dashboard/top-products-tile.tsx", "utf8");
const workTilesSource = readFileSync("src/components/dashboard/work-tiles.tsx", "utf8");
const dashboardViewSource = readFileSync("src/components/dashboard/dashboard-view.tsx", "utf8");

let passed = 0;
const check = (name: string, test: () => void) => {
  test();
  passed++;
  console.log(`  ok   ${name}`);
};

const identity = (v: number) => v;

check("initial visible row limit and step size are both 5", () => {
  assert.match(topProductsSource, /export const INITIAL_VISIBLE_ROWS = 5;/);
  assert.match(topProductsSource, /export const VISIBLE_STEP_ROWS = 5;/);
});

check("TopProductsTile slices all three views (value, qty, customer) to visibleCount", () => {
  assert.match(topProductsSource, /byCustomer\.slice\(0, visibleCount\)/);
  assert.match(topProductsSource, /rows\.slice\(0, visibleCount\)/);
  assert.match(topProductsSource, /noun="customers"/);
  assert.match(topProductsSource, /noun="products"/);
});

check("TopProductsTile computes max bar scale across all rows before slicing", () => {
  const maxIdx = topProductsSource.indexOf("const max = Math.max(");
  const sliceIdx = topProductsSource.indexOf("const visibleRows = rows.slice(0, visibleCount);");
  assert.ok(maxIdx !== -1 && sliceIdx !== -1 && maxIdx < sliceIdx);
});

check("TopProductsTile resets visibleCount when view or periodLabel changes", () => {
  assert.match(topProductsSource, /setVisibleCount\(INITIAL_VISIBLE_ROWS\);\s*\}, \[view, periodLabel\]\)/);
});

check("ExpectedCloseTile and SamplesAwaitingTile slice to visibleCount and reset on periodLabel", () => {
  assert.equal((workTilesSource.match(/rows\.slice\(0, visibleCount\)/g) ?? []).length, 2);
  assert.equal((workTilesSource.match(/setVisibleCount\(INITIAL_VISIBLE_ROWS\);\s*\}, \[periodLabel\]\)/g) ?? []).length, 2);
  assert.match(workTilesSource, /noun="deals"/);
  assert.match(workTilesSource, /noun="samples"/);
});

check("Option B step-by-step footer hides when total <= 5 and shows both Show more and Show less when expanded", () => {
  for (const src of [topProductsSource, workTilesSource]) {
    assert.match(src, /if \(total <= INITIAL_VISIBLE_ROWS\) return null;/);
    assert.match(src, /Show \{nextStep\} more \(\{shown\} of \{total\} \{noun\}\) ↓/);
    assert.match(src, /visibleCount > INITIAL_VISIBLE_ROWS/);
    assert.match(src, /Show less ↑/);
  }
});

check("ExpectedCloseSummary still sums all matching rows in DashboardView", () => {
  assert.match(dashboardViewSource, /<ExpectedCloseSummary rows=\{expected\} formatMoney=\{money\} \/>/);
  assert.match(dashboardViewSource, /<ExpectedCloseTile\s+rows=\{expected\}\s+formatMoney=\{money\}\s+periodLabel=\{periodLabel\}\s*\/>/);
  assert.match(dashboardViewSource, /<SamplesAwaitingTile\s+rows=\{samples\}\s+formatMoney=\{money\}\s+periodLabel=\{periodLabel\}\s*\/>/);
});

check("underlying metrics return full unsorted/sorted datasets without truncation", () => {
  const products = topProducts(DEALS, "all", identity);
  const byCust = productsByCustomer(DEALS, "all", identity);
  const expected = expectedToClose(DEALS, "all", identity);
  const samples = samplesAwaiting(DEALS, "all", identity);
  assert.ok(products.length > 5, `expected >5 products, got ${products.length}`);
  assert.ok(byCust.length > 5, `expected >5 customer product groups, got ${byCust.length}`);
  assert.ok(expected.length > 5, `expected >5 expected-to-close deals, got ${expected.length}`);
  assert.ok(samples.length > 0, `expected >0 samples, got ${samples.length}`);
});

console.log(`\n${passed} passed, 0 failed`);
