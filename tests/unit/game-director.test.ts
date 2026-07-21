import assert from "node:assert/strict";
import test from "node:test";

import { evaluateGameDirector } from "../../src/core/domain/game-director.ts";

test("prevents overload before proposing new contracts", () => {
  const proposals = evaluateGameDirector({ playerId: "player-1", observedAt: new Date(), activeContractCount: 3, maximumActiveContracts: 3, neglectedCategories: ["vitalidad"], recoveryNeeded: true, activeBossIds: [], seasonalSignal: undefined });
  assert.deepEqual(proposals, [{ type: "reduce_load", reason: "La carga activa alcanzo el limite configurado" }]);
});

test("proposes balanced opportunities from persisted signals without mutating state", () => {
  const proposals = evaluateGameDirector({ playerId: "player-1", observedAt: new Date(), activeContractCount: 1, maximumActiveContracts: 3, neglectedCategories: ["social", "arte", "social"], recoveryNeeded: false, activeBossIds: ["boss-2", "boss-1"], seasonalSignal: "inicio_de_ano" });
  assert.deepEqual(proposals, [
    { type: "balance_contract", category: "arte", reason: "El Motor detecto un area descuidada" },
    { type: "balance_contract", category: "social", reason: "El Motor detecto un area descuidada" },
    { type: "boss_review", bossId: "boss-1", reason: "Revision estrategica de boss activo" },
    { type: "boss_review", bossId: "boss-2", reason: "Revision estrategica de boss activo" },
    { type: "seasonal_event_review", signal: "inicio_de_ano" }
  ]);
});

test("prioritizes a low-difficulty recovery proposal when capacity exists", () => {
  const proposals = evaluateGameDirector({ playerId: "player-1", observedAt: new Date(), activeContractCount: 1, maximumActiveContracts: 3, neglectedCategories: ["vitalidad"], recoveryNeeded: true, activeBossIds: [], seasonalSignal: undefined });
  assert.equal(proposals[0].type, "recovery_contract");
});
