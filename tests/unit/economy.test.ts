import assert from "node:assert/strict";
import test from "node:test";

import { awardCurrencyFromMotor, createMarketReward, redeemMarketReward, type MarketReward } from "../../src/core/domain/economy.ts";

function reward(): MarketReward {
  return { id: "reward-1", playerId: "player-1", name: "Visitar un museo", description: "Una tarde de inspiracion", cost: 50, category: "arte", status: "activa" };
}

test("only a valid Motor action can award Adventurer Coins", () => {
  assert.equal(awardCurrencyFromMotor(10, { amount: 20, source: "contrato_completado", sourceId: "contract-1" }), 30);
  assert.throws(() => awardCurrencyFromMotor(10, { amount: 0, source: "contrato_completado", sourceId: "contract-1" }), /valid action/);
});

test("a market redemption is never allowed to create negative balance", () => {
  const catalogItem = createMarketReward(reward());
  assert.equal(redeemMarketReward(50, catalogItem), 0);
  assert.throws(() => redeemMarketReward(49, catalogItem), /insufficient/);
});

test("inactive rewards cannot be redeemed", () => {
  assert.throws(() => redeemMarketReward(100, { ...reward(), status: "inactiva" }), /active/);
});
