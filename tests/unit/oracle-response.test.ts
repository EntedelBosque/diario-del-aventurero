import assert from "node:assert/strict";
import test from "node:test";

import { validateOracleResponse } from "../../src/core/domain/oracle-response.ts";
const response = {
  summary: "Entrada registrada.",
  narrative: "Una cronica breve.",
  contractEvidence: [], bossEvidence: [], activities: [], entitySuggestions: [], emotions: []
};

test("accepts a factual Oracle proposal without state changes", () => {
  const result = validateOracleResponse(response);
  assert.equal(result.ok, true);
});

test("rejects state-changing fields proposed by the Oracle", () => {
  const result = validateOracleResponse({ ...response, stats: { arte: 1 } });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.includes("stats is not permitted in an Oracle response"));
});

test("accepts activities only when their core-stat weights total 100", () => {
  const valid = validateOracleResponse({
    ...response,
    activities: [{ category: "arte", scale: "media", durationMinutes: 60, classifications: [{ stat: "arte", weight: 60 }, { stat: "sabiduria", weight: 40 }] }]
  });
  assert.equal(valid.ok, true);

  const invalid = validateOracleResponse({
    ...response,
    activities: [{ category: "arte", scale: "media", durationMinutes: 60, classifications: [{ stat: "arte", weight: 70 }] }]
  });
  assert.equal(invalid.ok, false);
});

test("requires an activity category for the Motor to resolve its guild", () => {
  const result = validateOracleResponse({
    ...response,
    activities: [{ scale: "media", durationMinutes: 60, classifications: [{ stat: "arte", weight: 100 }] }]
  });
  assert.equal(result.ok, false);
});

test("normalizes entity suggestions without creating world memory", () => {
  const result = validateOracleResponse({
    ...response,
    entitySuggestions: [{ type: "herramienta", name: "  ZBrush  ", alias: " ZB ", category: "Escultura 3D" }]
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value.entitySuggestions, [{ type: "herramienta", name: "ZBrush", alias: "ZB", category: "Escultura 3D" }]);
});

test("records emotions only when the Oracle can identify them", () => {
  const result = validateOracleResponse({ ...response, emotions: [{ name: "satisfaccion" }] });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.emotions[0].name, "satisfaccion");
});

test("accepts boss evidence but never damage proposed by the Oracle", () => {
  const result = validateOracleResponse({ ...response, bossEvidence: [{ bossId: "boss-1", rationale: "Se completo el contrato de pasaporte" }] });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.bossEvidence[0].bossId, "boss-1");
});
