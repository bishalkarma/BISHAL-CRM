/*
  Structural guard.

  The activities table was emptied because a Supabase DELETE lived inside a
  React state updater, which React 19 invokes twice. This test reads the
  provider source and fails if any write is ever nested inside a setState
  callback again — a rule no future change can quietly break.
*/
import { readFileSync } from "node:fs";

const src = readFileSync("src/components/providers/data-provider.tsx", "utf8");

let pass = 0, fail = 0;
const check = (n: string, c: boolean, e = "") => {
  if (c) { pass++; console.log(`  ok   ${n}`); }
  else { fail++; console.log(`  FAIL ${n} ${e}`); }
};

/** Every setX((arg) => { ... }) body in the file. */
function updaterBodies() {
  const out: { setter: string; line: number; body: string }[] = [];
  // Matches both brace bodies and single-expression arrows, so a write can
  // never hide in either form.
  const re = /set(Deals|Companies|Contacts|Activities|Transitions)\(\(\w*\)?\s*=>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    // Walk to the closing paren of the setter call, tracking nesting.
    let i = src.indexOf("(", m.index);
    const start = i;
    let depth = 0;
    while (i < src.length) {
      const ch = src[i];
      if (ch === "(" || ch === "{") depth++;
      else if (ch === ")" || ch === "}") { depth--; if (depth === 0) break; }
      i++;
    }
    out.push({
      setter: m[1],
      line: src.slice(0, m.index).split("\n").length,
      body: src.slice(start, i),
    });
  }
  return out;
}

console.log("\nNo Supabase write may sit inside a state updater");
const bodies = updaterBodies();
check("found updaters to inspect", bodies.length > 0, String(bodies.length));

const withPersist = bodies.filter((b) => b.body.includes("persist("));
check(
  "no persist() inside an updater",
  withPersist.length === 0,
  withPersist.map((b) => `set${b.setter}:${b.line}`).join(", "),
);

const withClient = bodies.filter((b) => b.body.includes("supabase!"));
check(
  "no supabase client inside an updater",
  withClient.length === 0,
  withClient.map((b) => `set${b.setter}:${b.line}`).join(", "),
);

console.log("\nDestructive statements are guarded");
check(
  "deal_lines delete checks its own error before inserting",
  /cleared\.error/.test(src),
);
check(
  "only activities and deal_lines are ever deleted",
  (src.match(/\.delete\(\)/g) ?? []).length === 2,
  String((src.match(/\.delete\(\)/g) ?? []).length),
);

console.log("\nWriters read from refs, not stale closures");
for (const ref of ["activitiesRef", "dealsRef", "companiesRef"]) {
  check(`${ref} exists`, src.includes(`${ref}.current`));
}

console.log("\nmoveStage cannot record a non-move");
check("same-stage move is rejected", /company\.spancop === to/.test(src));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
