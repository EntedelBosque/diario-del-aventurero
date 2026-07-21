import assert from "node:assert/strict";
import test from "node:test";

import { createContract, expireContractIfDue, transitionContract, type Contract } from "../../src/core/domain/contracts.ts";

function dailyContract(): Contract {
  const startsAt = new Date("2026-07-21T00:00:00Z");
  return { id: "contract-1", playerId: "player-1", type: "diario", objective: "Caminar 30 minutos", state: "activo", difficulty: "facil", priority: "media", categories: ["vitalidad"], origin: "motor", rewards: { experience: 20 }, startsAt, expiresAt: new Date("2026-07-22T00:00:00Z") };
}

test("requires all essential contract fields and the official daily duration", () => {
  assert.equal(createContract(dailyContract()).objective, "Caminar 30 minutos");
  assert.throws(() => createContract({ ...dailyContract(), rewards: {}, expiresAt: new Date("2026-07-22T01:00:00Z") }), /reward/);
  assert.throws(() => createContract({ ...dailyContract(), expiresAt: new Date("2026-07-21T23:00:00Z") }), /official duration/);
});

test("only the Motor can complete a contract with registered evidence", () => {
  assert.throws(() => transitionContract(dailyContract(), "completado"), /evidence/);
  assert.equal(transitionContract(dailyContract(), "completado", ["event-1"]).state, "completado");
});

test("Oracle evidence is only a proposal until the Motor validates an event", () => {
  const proposedEvidence = { contractId: "contract-1", rationale: "La entrada describe la caminata" };
  assert.throws(() => transitionContract(dailyContract(), "completado"), /evidence/);
  assert.equal(transitionContract(dailyContract(), "completado", ["world-event-1"]).id, proposedEvidence.contractId);
});

test("expiry does not erase the contract or its potential reward", () => {
  const expired = expireContractIfDue(dailyContract(), new Date("2026-07-22T00:00:00Z"));
  assert.equal(expired.state, "expirado");
  assert.equal(expired.rewards.experience, 20);
});
