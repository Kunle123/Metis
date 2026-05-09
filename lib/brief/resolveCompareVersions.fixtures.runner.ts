import assert from "node:assert";

import { resolveCompareVersionPair, type CompareVersionRowLite } from "./resolveCompareVersions";

function row(id: string, versionNumber: number, createdMs: number): CompareVersionRowLite {
  return { id, versionNumber, createdAt: new Date(createdMs) };
}

function run() {
  const v5 = row("v5-id", 5, 5000);
  const v4 = row("v4-id", 4, 4000);
  const v3 = row("v3-id", 3, 3000);

  const desc = [v5, v4, v3];

  assert.deepStrictEqual(resolveCompareVersionPair(desc, undefined, undefined), {
    from: v4,
    to: v5,
    sameVersionSelected: false,
    selectionCoercion: "none",
  });

  const ex = resolveCompareVersionPair(desc, v3.id, v5.id);
  assert.strictEqual(ex.from?.id, v3.id);
  assert.strictEqual(ex.to?.id, v5.id);
  assert.strictEqual(ex.sameVersionSelected, false);
  assert.strictEqual(ex.selectionCoercion, "none");

  assert.deepStrictEqual(resolveCompareVersionPair(desc, v4.id, v4.id), {
    from: v4,
    to: v4,
    sameVersionSelected: true,
    selectionCoercion: "same_version",
  });

  const bad = resolveCompareVersionPair(desc, "bad-uuid", v5.id);
  assert.strictEqual(bad.selectionCoercion, "invalid_params_ignored");
  assert.ok(bad.to);
  assert.strictEqual(bad.to.id, v5.id);
  assert.strictEqual(bad.from?.id, v4.id);

  const onlyTo = resolveCompareVersionPair(desc, undefined, v3.id);
  assert.ok(onlyTo.to);
  assert.strictEqual(onlyTo.to.id, v3.id);
  assert.strictEqual(onlyTo.from, null);
  assert.strictEqual(onlyTo.sameVersionSelected, false);
  assert.strictEqual(onlyTo.selectionCoercion, "none");

  const onlyFromMid = resolveCompareVersionPair(desc, v4.id, undefined);
  assert.ok(onlyFromMid.from);
  assert.ok(onlyFromMid.to);
  assert.strictEqual(onlyFromMid.from.id, v4.id);
  assert.strictEqual(onlyFromMid.to.id, v5.id);
  assert.strictEqual(onlyFromMid.selectionCoercion, "inferred_to");

  const onlyFromNewest = resolveCompareVersionPair(desc, v5.id, undefined);
  assert.ok(onlyFromNewest.from);
  assert.ok(onlyFromNewest.to);
  assert.strictEqual(onlyFromNewest.from.id, v5.id);
  assert.strictEqual(onlyFromNewest.to.id, v5.id);
  assert.strictEqual(onlyFromNewest.sameVersionSelected, true);
  assert.strictEqual(onlyFromNewest.selectionCoercion, "same_version");

  const single = resolveCompareVersionPair([v5], undefined, undefined);
  assert.strictEqual(single.from, null);
  assert.strictEqual(single.to?.id, v5.id);
}

run();
console.log("resolveCompareVersionPair fixtures: ok");
