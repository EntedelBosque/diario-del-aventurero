import type { DiaryEntry } from "../domain/diary-entry.ts";
import type { OracleResponse } from "../domain/oracle-response.ts";

export type StoredDiaryEntry = DiaryEntry & {
  oracleStatus: "pending" | "accepted" | "rejected" | "failed";
  oracleResponse?: OracleResponse;
  oracleErrors?: string[];
};

export interface DiaryEntryRepository {
  findByIdempotencyKey(playerId: string, idempotencyKey: string): Promise<StoredDiaryEntry | null>;
  record(entry: DiaryEntry): Promise<StoredDiaryEntry>;
  saveAcceptedOracleResponse(entryId: string, response: OracleResponse): Promise<StoredDiaryEntry>;
  saveRejectedOracleResponse(entryId: string, errors: string[]): Promise<StoredDiaryEntry>;
  saveOracleFailure(entryId: string, reason: string): Promise<StoredDiaryEntry>;
}
