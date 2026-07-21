import assert from "node:assert/strict";
import test from "node:test";

import { operationalBossEvidence } from "../../src/core/domain/boss-evidence.ts";

test("counts only evidence after the boss appeared or its latest reset", () => {
  const appearedAt = new Date("2026-07-01T00:00:00Z");
  const result = operationalBossEvidence("boss-1", appearedAt, [
    { bossId: "boss-1", points: 5, recordedAt: new Date("2026-07-02T00:00:00Z") },
    { bossId: "boss-1", points: 8, recordedAt: new Date("2026-07-04T00:00:00Z") },
    { bossId: "boss-2", points: 99, recordedAt: new Date("2026-07-05T00:00:00Z") }
  ], [{ bossId: "boss-1", reason: "derrotado", resetAt: new Date("2026-07-03T00:00:00Z") }]);
  assert.equal(result, 8);
});
