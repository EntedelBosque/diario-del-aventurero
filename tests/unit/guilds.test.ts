import assert from "node:assert/strict";
import test from "node:test";
import { allocateGuildExperience, awardGuildExperience } from "../../src/core/domain/guilds.ts";

test("splits one activity across multiple official guilds without losing experience", () => {
  const allocation = allocateGuildExperience(63, [{ guildCode: "atelier_bosque", weight: 60 }, { guildCode: "archivo_eterno", weight: 40 }]);
  assert.equal(allocation.atelier_bosque, 38);
  assert.equal(allocation.archivo_eterno, 25);
  assert.equal(Object.values(allocation).reduce((total, value) => total + value, 0), 63);
});

test("guild mastery and experience are permanent", () => {
  const progress = awardGuildExperience({ guildCode: "forja_acero", experience: 100, level: 1, mastery: 100 }, 20);
  assert.deepEqual(progress, { guildCode: "forja_acero", experience: 120, level: 1, mastery: 120 });
});
