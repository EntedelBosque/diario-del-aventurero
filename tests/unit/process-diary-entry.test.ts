import assert from "node:assert/strict";
import test from "node:test";

import { ProcessDiaryEntry } from "../../src/core/application/process-diary-entry.ts";
import type { DiaryEntry } from "../../src/core/domain/diary-entry.ts";
import type { OracleResponse } from "../../src/core/domain/oracle-response.ts";
import type { DiaryEntryRepository, StoredDiaryEntry } from "../../src/core/ports/diary-entry-repository.ts";

class MemoryDiaryEntries implements DiaryEntryRepository {
  private readonly entries = new Map<string, StoredDiaryEntry>();

  async findByIdempotencyKey(playerId: string, key: string) {
    return this.entries.get(`${playerId}:${key}`) ?? null;
  }

  async record(entry: DiaryEntry) {
    const stored: StoredDiaryEntry = { ...entry, oracleStatus: "pending" };
    this.entries.set(`${entry.playerId}:${entry.idempotencyKey}`, stored);
    return stored;
  }

  async saveAcceptedOracleResponse(entryId: string, response: OracleResponse) {
    return this.update(entryId, { oracleStatus: "accepted", oracleResponse: response });
  }

  async saveRejectedOracleResponse(entryId: string, oracleErrors: string[]) {
    return this.update(entryId, { oracleStatus: "rejected", oracleErrors });
  }

  async saveOracleFailure(entryId: string, reason: string) {
    return this.update(entryId, { oracleStatus: "failed", oracleErrors: [reason] });
  }

  private update(entryId: string, changes: Partial<StoredDiaryEntry>): StoredDiaryEntry {
    const entry = [...this.entries.values()].find((candidate) => candidate.id === entryId);
    if (!entry) throw new Error("entry not found");
    const updated = { ...entry, ...changes } as StoredDiaryEntry;
    this.entries.set(`${updated.playerId}:${updated.idempotencyKey}`, updated);
    return updated;
  }
}

const validResponse = {
  summary: "Se registro una jornada de estudio.",
  narrative: "La cronica queda escrita.",
  stats: { arte: 0, tecnologia: 1, vitalidad: 0, social: 0, sabiduria: 0 },
  newCharacters: [], newKnowledge: [], contractEvidence: [], bossDamage: [], activities: [], entitySuggestions: []
};

test("records the fact before accepting a valid Oracle proposal", async () => {
  const entries = new MemoryDiaryEntries();
  const useCase = new ProcessDiaryEntry({
    diaryEntries: entries,
    loadOracleContext: async () => ({ activeStats: {}, relevantEntities: [], activeContractIds: [], activeBossIds: [] }),
    oracle: { interpret: async () => validResponse }
  });

  const result = await useCase.execute({ id: "entry-1", playerId: "player-1", idempotencyKey: "request-1", text: " Estudie TypeScript ", occurredAt: new Date("2026-07-21T10:00:00Z"), submittedAt: new Date("2026-07-21T11:00:00Z") });

  assert.equal(result.oracleStatus, "accepted");
  assert.equal(result.text, "Estudie TypeScript");
  assert.equal(result.oracleResponse?.stats.tecnologia, 1);
});

test("keeps the fact and rejects malformed Oracle data", async () => {
  const entries = new MemoryDiaryEntries();
  const useCase = new ProcessDiaryEntry({
    diaryEntries: entries,
    loadOracleContext: async () => ({ activeStats: {}, relevantEntities: [], activeContractIds: [], activeBossIds: [] }),
    oracle: { interpret: async () => ({ summary: "incomplete" }) }
  });

  const result = await useCase.execute({ id: "entry-2", playerId: "player-1", idempotencyKey: "request-2", text: "Escribi una nota", occurredAt: new Date(), submittedAt: new Date() });

  assert.equal(result.oracleStatus, "rejected");
  assert.ok(result.oracleErrors?.includes("narrative must be a non-empty string"));
});

test("returns the original result for a repeated idempotency key", async () => {
  const entries = new MemoryDiaryEntries();
  let oracleCalls = 0;
  const useCase = new ProcessDiaryEntry({
    diaryEntries: entries,
    loadOracleContext: async () => ({ activeStats: {}, relevantEntities: [], activeContractIds: [], activeBossIds: [] }),
    oracle: { interpret: async () => { oracleCalls += 1; return validResponse; } }
  });
  const command = { id: "entry-3", playerId: "player-1", idempotencyKey: "request-3", text: "Practique", occurredAt: new Date(), submittedAt: new Date() };

  await useCase.execute(command);
  const repeated = await useCase.execute({ ...command, id: "other-entry" });

  assert.equal(repeated.id, "entry-3");
  assert.equal(oracleCalls, 1);
});
