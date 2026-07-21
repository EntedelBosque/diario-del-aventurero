import assert from "node:assert/strict";
import test from "node:test";

import { mergeEntities, normalizeEntityName } from "../../src/core/domain/world-memory.ts";

test("preserves both identities as aliases when entities merge", () => {
  const merged = mergeEntities(
    { id: "canonical", type: "herramienta", name: "ZBrush", aliases: ["ZB"], discoveredAt: new Date() },
    { id: "duplicate", type: "herramienta", name: "Z Brush", aliases: ["Pixologic ZBrush"], discoveredAt: new Date() }
  );
  assert.deepEqual(merged.aliases, ["ZB", "Pixologic ZBrush", "Z Brush"]);
});

test("normalizes entity names without losing their identity", () => {
  assert.equal(normalizeEntityName("  Museo   Nacional  "), "Museo Nacional");
  assert.throws(() => normalizeEntityName("   "), /required/);
});
