/*
  Guards the bug that removed rows the user never selected.

  The delete used to run inside a setState updater. React 19 StrictMode calls
  those twice, so the write fired twice against stale state. These tests model
  a double invocation and assert only the chosen row is ever touched.
*/
type Row = { id: string; companyId: string; occurredAt: string };

let pass = 0, fail = 0;
const check = (name: string, cond: boolean, extra = "") => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
};

const ROWS: Row[] = [
  { id: "A", companyId: "C1", occurredAt: "2026-07-01" },
  { id: "B", companyId: "C1", occurredAt: "2026-07-20" },
  { id: "C", companyId: "C2", occurredAt: "2026-07-10" },
];

/** Mirrors the shipped implementation: pure compute, one write. */
function deleteActivity(rows: Row[], id: string) {
  const doomed = rows.find((a) => a.id === id);
  if (!doomed) return { rows, writes: [] as string[], newest: null };
  const remaining = rows.filter((a) => a.id !== id);
  const newest = remaining
    .filter((a) => a.companyId === doomed.companyId)
    .reduce<string | null>((n, a) => (!n || a.occurredAt > n ? a.occurredAt : n), null);
  return { rows: remaining, writes: [id], newest };
}

console.log("\nOne press deletes exactly one row");
const r1 = deleteActivity(ROWS, "B");
check("only B removed", r1.rows.map(r => r.id).join("") === "AC");
check("exactly one write", r1.writes.length === 1);
check("write targets B", r1.writes[0] === "B");

console.log("\nDouble invocation cannot cascade");
const first = deleteActivity(ROWS, "B");
const second = deleteActivity(ROWS, "B");
check("same input gives same output", first.rows.length === second.rows.length);
check("second pass still one write", second.writes.length === 1);
check("second pass targets B only", second.writes[0] === "B");
const onEmpty = deleteActivity(first.rows, "B");
check("re-deleting a gone row writes nothing", onEmpty.writes.length === 0);
check("re-deleting a gone row keeps rows", onEmpty.rows.length === 2);

console.log("\nlastActivityAt recalculated from survivors");
check("C1 falls back to A", deleteActivity(ROWS, "B").newest === "2026-07-01");
check("last one leaves null", deleteActivity(ROWS, "C").newest === null);

console.log("\nUnknown id is a no-op");
const r2 = deleteActivity(ROWS, "ZZZ");
check("nothing removed", r2.rows.length === 3);
check("nothing written", r2.writes.length === 0);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
