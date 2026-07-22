import type { DiaryEntry } from "../../core/domain/diary-entry.ts";
import type { OracleResponse } from "../../core/domain/oracle-response.ts";
import type { DiaryEntryRepository, StoredDiaryEntry } from "../../core/ports/diary-entry-repository.ts";
import { createServiceSupabaseClient } from "./supabase-server.ts";

type DiaryRow = { id: string; player_id: string; idempotency_key: string; body: string; occurred_at: string; submitted_at: string; oracle_status: StoredDiaryEntry["oracleStatus"]; world_event_id: string | null };

export class SupabaseDiaryEntryRepository implements DiaryEntryRepository {
  private readonly supabase = createServiceSupabaseClient();

  async findByIdempotencyKey(playerId: string, idempotencyKey: string): Promise<StoredDiaryEntry | null> {
    const { data, error } = await this.supabase.from("diary_entries").select("*, oracle_interpretations(status, response, errors)").eq("player_id", playerId).eq("idempotency_key", idempotencyKey).maybeSingle();
    if (error) throw new Error(`Could not read diary entry: ${error.message}`);
    return data ? toStoredEntry(data as DiaryRow & { oracle_interpretations?: InterpretationRow[] }) : null;
  }

  async listAcceptedPages(playerId: string): Promise<Array<{ id: string; occurredAt: Date; title?: string; narrative: string }>> {
    const { data, error } = await this.supabase
      .from("diary_entries")
      .select("id, occurred_at, oracle_interpretations!inner(status, response)")
      .eq("player_id", playerId)
      .eq("oracle_interpretations.status", "accepted")
      .order("occurred_at", { ascending: false });
    if (error) throw new Error(`Could not list diary pages: ${error.message}`);
    return (data ?? []).flatMap((row) => {
      const response = readInterpretation(row.oracle_interpretations)?.response;
      if (!response) return [];
      return [{ id: row.id as string, occurredAt: new Date(row.occurred_at as string), title: response.title, narrative: response.narrative }];
    });
  }

  async record(entry: DiaryEntry): Promise<StoredDiaryEntry> {
    const { data, error } = await this.supabase.from("diary_entries").insert({ id: entry.id, player_id: entry.playerId, idempotency_key: entry.idempotencyKey, body: entry.text, occurred_at: entry.occurredAt.toISOString(), submitted_at: entry.submittedAt.toISOString() }).select().single();
    if (error) throw new Error(`Could not record diary entry: ${error.message}`);
    return toStoredEntry(data as DiaryRow);
  }

  async saveAcceptedOracleResponse(entryId: string, response: OracleResponse): Promise<StoredDiaryEntry> {
    return this.saveInterpretation(entryId, "accepted", response, null);
  }

  async saveRejectedOracleResponse(entryId: string, errors: string[]): Promise<StoredDiaryEntry> {
    return this.saveInterpretation(entryId, "rejected", null, errors);
  }

  async saveOracleFailure(entryId: string, reason: string): Promise<StoredDiaryEntry> {
    return this.saveInterpretation(entryId, "failed", null, [reason]);
  }

  private async saveInterpretation(entryId: string, status: "accepted" | "rejected" | "failed", response: OracleResponse | null, errors: string[] | null): Promise<StoredDiaryEntry> {
    const { error: interpretationError } = await this.supabase.from("oracle_interpretations").upsert({ diary_entry_id: entryId, status, response, errors });
    if (interpretationError) throw new Error(`Could not save Oracle interpretation: ${interpretationError.message}`);
    const existing = await this.supabase.from("diary_entries").select().eq("id", entryId).single();
    if (existing.error) throw new Error(`Could not read diary entry for Oracle persistence: ${existing.error.message}`);
    let worldEventId = existing.data.world_event_id as string | null;
    if (status === "accepted" && response && !worldEventId) {
      const { data: event, error: eventError } = await this.supabase.from("world_events").insert({ player_id: existing.data.player_id, event_type: "diary_entry_interpreted", schema_version: 1, rules_version: "oracle-contract-002", payload: { diaryEntryId: entryId, summary: response.summary, activities: response.activities, contractEvidence: response.contractEvidence, bossEvidence: response.bossEvidence }, occurred_at: existing.data.occurred_at }).select("id").single();
      if (eventError) throw new Error(`Could not create world event: ${eventError.message}`);
      worldEventId = event.id as string;
    }
    const { data, error } = await this.supabase.from("diary_entries").update({ oracle_status: status, ...(worldEventId ? { world_event_id: worldEventId } : {}) }).eq("id", entryId).select().single();
    if (error) throw new Error(`Could not update diary entry: ${error.message}`);
    return { ...toStoredEntry(data as DiaryRow), oracleStatus: status, ...(response ? { oracleResponse: response } : { oracleErrors: errors ?? [] }) };
  }
}

type InterpretationRow = { status: StoredDiaryEntry["oracleStatus"]; response: OracleResponse | null; errors: string[] | null };

// oracle_interpretations.diary_entry_id is a PRIMARY KEY, so PostgREST embeds it as a
// single object (to-one), not an array. Handle both shapes to be safe.
function readInterpretation(embed: unknown): InterpretationRow | undefined {
  if (Array.isArray(embed)) return embed[0] as InterpretationRow | undefined;
  return (embed as InterpretationRow | null) ?? undefined;
}

function toStoredEntry(row: DiaryRow & { oracle_interpretations?: InterpretationRow[] | InterpretationRow }): StoredDiaryEntry {
  const interpretation = readInterpretation(row.oracle_interpretations);
  return { id: row.id, playerId: row.player_id, idempotencyKey: row.idempotency_key, text: row.body, occurredAt: new Date(row.occurred_at), submittedAt: new Date(row.submitted_at), oracleStatus: row.oracle_status, ...(row.world_event_id ? { worldEventId: row.world_event_id } : {}), ...(interpretation?.response ? { oracleResponse: interpretation.response } : {}), ...(interpretation?.errors ? { oracleErrors: interpretation.errors } : {}) };
}
