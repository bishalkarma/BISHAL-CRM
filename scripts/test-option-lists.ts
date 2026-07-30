/* Cluster and Category dropdowns must remember what the user typed. */
import { mergeOptions, isNewOption } from "../src/lib/option-lists";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, e = "") => {
  if (c) { pass++; console.log(`  ok   ${n}`); }
  else { fail++; console.log(`  FAIL ${n} ${e}`); }
};

const SUGGESTED = ["Kerzner Group", "Jumeirah Group", "Independent"];

console.log("\nSaved values appear");
const saved = ["Emaar Hospitality", "Address Hotels"];
const r = mergeOptions(saved, SUGGESTED);
check("new cluster is listed", r.includes("Emaar Hospitality"));
check("suggestions still there", r.includes("Kerzner Group"));
check("total is 5", r.length === 5, String(r.length));

console.log("\nNoise is ignored");
check("nulls dropped", !mergeOptions([null, undefined, ""], []).length);
check("whitespace trimmed", mergeOptions(["  Emaar  "], [])[0] === "Emaar");
check("blank-only entry dropped", mergeOptions(["   "], []).length === 0);

console.log("\nDe-duplication is case-insensitive");
const dup = mergeOptions(["Emaar Hospitality", "emaar hospitality", "EMAAR HOSPITALITY"], []);
check("three spellings collapse to one", dup.length === 1, String(dup.length));
check("first spelling wins", dup[0] === "Emaar Hospitality");
const clash = mergeOptions(["independent"], ["Independent"]);
check("saved beats suggestion", clash.length === 1 && clash[0] === "independent");

console.log("\nSorted for scanning");
const sorted = mergeOptions(["Zuma Group", "Address", "marriott"], []);
check("alphabetical, case-insensitive", sorted.join("|") === "Address|marriott|Zuma Group", sorted.join("|"));

console.log("\nisNewOption guards the create row");
check("unknown value is new", isNewOption("Hilton", SUGGESTED));
check("known value is not new", !isNewOption("Kerzner Group", SUGGESTED));
check("different case is not new", !isNewOption("kerzner group", SUGGESTED));
check("blank is never new", !isNewOption("   ", SUGGESTED));

console.log("\nEmpty database still offers suggestions");
check("falls back to suggestions", mergeOptions([], SUGGESTED).length === 3);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
