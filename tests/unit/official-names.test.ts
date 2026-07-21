import assert from "node:assert/strict";
import test from "node:test";

import { createImmutableSlug, normalizeOfficialName } from "../../src/core/domain/official-names.ts";

test("normalizes accents and whitespace for global official-name checks", () => {
  assert.equal(normalizeOfficialName("  La Forja del Acéro  "), "la forja del acero");
  assert.equal(createImmutableSlug("La Forja del Acero"), "la-forja-del-acero");
});
