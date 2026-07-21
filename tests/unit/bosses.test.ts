import assert from "node:assert/strict";
import test from "node:test";

import { activateBoss, applyMotorBossDamage, archiveBoss, createBoss, type Boss } from "../../src/core/domain/bosses.ts";

function discoveredBoss(): Boss {
  return { id: "boss-1", playerId: "player-1", name: "El Guardian del Cuerpo", description: "Mantener una excelente condicion fisica.", categories: ["vitalidad"], level: 1, maxHealth: 100, currentHealth: 100, difficulty: "epico", state: "descubierto", appearedAt: new Date(), rewards: { experience: 100 } };
}

test("a boss only takes Motor-calculated damage backed by evidence", () => {
  const active = activateBoss(createBoss(discoveredBoss()));
  assert.throws(() => applyMotorBossDamage(active, { amount: 10, sourceEventIds: [], completedContractIds: [] }), /evidence/);
  const weakened = applyMotorBossDamage(active, { amount: 25, sourceEventIds: ["event-1"], completedContractIds: [] });
  assert.equal(weakened.currentHealth, 75);
  assert.equal(weakened.state, "debilitado");
});

test("defeat and archive preserve the boss instead of deleting it", () => {
  const active = activateBoss(discoveredBoss());
  const defeated = applyMotorBossDamage(active, { amount: 150, sourceEventIds: [], completedContractIds: ["contract-1"] });
  assert.equal(defeated.currentHealth, 0);
  assert.equal(defeated.state, "derrotado");
  assert.equal(archiveBoss(defeated).state, "archivado");
});
