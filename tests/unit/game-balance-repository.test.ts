import assert from "node:assert/strict";
import test from "node:test";

import { requireActiveBalanceTable, type GameBalanceRepository } from "../../src/core/ports/game-balance-repository.ts";

test("the Motor fails explicitly when a required active balance table is absent", async () => {
  const repository: GameBalanceRepository = { getActive: async () => null };
  await assert.rejects(() => requireActiveBalanceTable(repository, "diminishing_returns"), /Missing active game balance table: diminishing_returns/);
});
