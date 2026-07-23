import assert from "node:assert/strict";
import test from "node:test";

import { calculateExperience, experienceRequiredForNextLevel, levelForExperience } from "../../src/core/domain/progression.ts";

test("calculates XP with every official component", () => {
  const result = calculateExperience({
    scale: "pequena",
    durationMinutes: 45,
    classifications: [{ stat: "tecnologia", weight: 60 }, { stat: "sabiduria", weight: 40 }],
    discoveries: [{ type: "herramienta", isFirstDiscovery: true }, { type: "conocimiento", isFirstDiscovery: false }],
    participants: [{ importance: "importante" }],
    bonusXp: 5
  });

  assert.deepEqual(result, {
    baseXp: 2, timeXp: 1, peopleXp: 1, discoveryXp: 1, bonusXp: 5, totalXp: 10
  });
});

test("caps the time component and grants discovery only once", () => {
  const result = calculateExperience({
    scale: "historica", durationMinutes: 500,
    classifications: [{ stat: "arte", weight: 100 }],
    discoveries: [{ type: "habilidad", isFirstDiscovery: false }], participants: [], bonusXp: 0
  });
  assert.equal(result.timeXp, 2);
  assert.equal(result.discoveryXp, 0);
  assert.equal(result.totalXp, 8);
});

test("requires a complete activity classification", () => {
  assert.throws(() => calculateExperience({
    scale: "media", durationMinutes: 10,
    classifications: [{ stat: "arte", weight: 70 }], discoveries: [], participants: [], bonusXp: 0
  }), /weights must add up to 100/);
});

test("derives general level from permanent cumulative XP", () => {
  assert.equal(experienceRequiredForNextLevel(1), 100);
  assert.equal(experienceRequiredForNextLevel(2), 283);
  assert.equal(levelForExperience(0), 1);
  assert.equal(levelForExperience(100), 2);
  assert.equal(levelForExperience(283), 3);
});
