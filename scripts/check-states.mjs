import assert from "node:assert/strict";
import {
  resolveBoardState,
  stateCopy,
} from "../lib/board-state.mjs";
import { boardTotals, splitRows, formatRupees } from "../lib/money.mjs";

const url = "https://example.supabase.co";
const key = "sb_publishable_test";

const missingUrl = resolveBoardState({ url: "", key, rows: null, error: null });
assert.equal(missingUrl.kind, "missing");
assert.deepEqual(missingUrl.missing, ["NEXT_PUBLIC_SUPABASE_URL"]);
assert.ok(stateCopy(missingUrl).body.includes("NEXT_PUBLIC_SUPABASE_URL"));

const missingKey = resolveBoardState({ url, key: "", rows: null, error: null });
assert.equal(missingKey.kind, "missing");
assert.deepEqual(missingKey.missing, ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]);
assert.ok(
  stateCopy(missingKey).detail.includes("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
);

const failed = resolveBoardState({
  url,
  key,
  rows: null,
  error: "permission denied for table chase_rows",
});
assert.equal(failed.kind, "failed");
assert.ok(stateCopy(failed).detail.includes("permission denied"));

const empty = resolveBoardState({ url, key, rows: [], error: null });
assert.equal(empty.kind, "empty");

const ready = resolveBoardState({ url, key, rows: [{ id: "1" }], error: null });
assert.equal(ready.kind, "ready");

const headings = [
  stateCopy(missingUrl).heading,
  stateCopy(failed).heading,
  stateCopy(empty).heading,
];
assert.equal(new Set(headings).size, 3, "the three states must read differently");
assert.notEqual(headings[0], headings[1]);
assert.notEqual(headings[1], headings[2]);
assert.notEqual(headings[0], headings[2]);

const rows = [
  { status: "pending", amount_paise: 90000 },
  { status: "promised", amount_paise: 350000 },
  { status: "paid", amount_paise: 180000 },
  { status: "lost", amount_paise: 60000 },
  { status: "pending", amount_paise: 0 },
];

const totals = boardTotals(rows);
assert.equal(totals.atRisk, 440000);
assert.equal(totals.promised, 350000);
assert.equal(totals.collected, 180000);
assert.equal(totals.lost, 60000);
assert.equal(totals.toChase, 3);
assert.equal(totals.promisedCount, 1);
assert.equal(formatRupees(440000), "\u20b94,400");

const split = splitRows(rows);
assert.equal(split.toChase.length, 3);
assert.equal(split.settled.length, 2);

console.log("PASS missing state names the setting: " + missingUrl.missing.join(", "));
console.log("PASS failed state carries the Supabase error");
console.log("PASS empty state is distinct");
console.log("PASS three headings are all different");
console.log("PASS totals: at risk " + formatRupees(totals.atRisk));
