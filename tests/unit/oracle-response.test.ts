import assert from "node:assert/strict";
import test from "node:test";

import { validateOracleResponse } from "../../src/core/domain/oracle-response.ts";
import { INITIAL_DERIVED_STATS } from "../../src/core/domain/adventurer.ts";

const response = {
  summary: "Entrada registrada.",
  narrative: "Una cronica breve.",
  stats: { arte: 0, tecnologia: 0, vitalidad: 1, social: 0, sabiduria: 0 },
  newCharacters: [], newKnowledge: [], contractEvidence: [], bossDamage: [], activities: [], entitySuggestions: []
};

test("accepts all five visible core statistics", () => {
  const result = validateOracleResponse(response);
  assert.equal(result.ok, true);
});

test("rejects manual discipline proposed by the Oracle", () => {
  const result = validateOracleResponse({ ...response, stats: { ...response.stats, disciplina: 1 } });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.includes("stats.disciplina cannot be assigned by the Oracle"));
});

test("starts Discipline at the visible derived-statistic baseline", () => {
  assert.equal(INITIAL_DERIVED_STATS.disciplina, 50);
});

test("accepts activities only when their core-stat weights total 100", () => {
  const valid = validateOracleResponse({
    ...response,
    activities: [{ scale: "media", durationMinutes: 60, classifications: [{ stat: "arte", weight: 60 }, { stat: "sabiduria", weight: 40 }] }]
  });
  assert.equal(valid.ok, true);

  const invalid = validateOracleResponse({
    ...response,
    activities: [{ scale: "media", durationMinutes: 60, classifications: [{ stat: "arte", weight: 70 }] }]
  });
  assert.equal(invalid.ok, false);
});

test("normalizes entity suggestions without creating world memory", () => {
  const result = validateOracleResponse({
    ...response,
    entitySuggestions: [{ type: "herramienta", name: "  ZBrush  ", alias: " ZB ", category: "Escultura 3D" }]
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value.entitySuggestions, [{ type: "herramienta", name: "ZBrush", alias: "ZB", category: "Escultura 3D" }]);
});
