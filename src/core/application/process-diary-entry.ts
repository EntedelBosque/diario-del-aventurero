import { createDiaryEntry, type RecordDiaryEntry } from "../domain/diary-entry.ts";
import { validateOracleResponse } from "../domain/oracle-response.ts";
import type { DiaryEntryRepository, StoredDiaryEntry } from "../ports/diary-entry-repository.ts";
import type { OracleAgent, OracleContext } from "../ports/oracle-agent.ts";

export type ProcessDiaryEntryDependencies = {
  diaryEntries: DiaryEntryRepository;
  oracle: OracleAgent;
  loadOracleContext(playerId: string): Promise<OracleContext>;
};

export class ProcessDiaryEntry {
  private readonly dependencies: ProcessDiaryEntryDependencies;

  constructor(dependencies: ProcessDiaryEntryDependencies) {
    this.dependencies = dependencies;
  }

  async execute(command: RecordDiaryEntry): Promise<StoredDiaryEntry> {
    const existing = await this.dependencies.diaryEntries.findByIdempotencyKey(command.playerId, command.idempotencyKey);
    if (existing) return existing;

    const entry = createDiaryEntry(command);
    const stored = await this.dependencies.diaryEntries.record(entry);

    try {
      const context = await this.dependencies.loadOracleContext(entry.playerId);
      const rawResponse = await this.dependencies.oracle.interpret(entry, context);
      const validated = validateOracleResponse(rawResponse);

      return validated.ok
        ? this.dependencies.diaryEntries.saveAcceptedOracleResponse(stored.id, validated.value)
        : this.dependencies.diaryEntries.saveRejectedOracleResponse(stored.id, validated.errors);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown Oracle failure";
      return this.dependencies.diaryEntries.saveOracleFailure(stored.id, reason);
    }
  }
}
