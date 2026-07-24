import { createServiceSupabaseClient } from "./supabase-server.ts";

// DEV-SPEC-017 — Event Engine. Los cambios importantes se representan como Eventos y se REGISTRAN
// antes de procesarse. Reutilizamos `world_events` como el log de eventos del mundo (ya persiste
// event_type/payload/occurred_at por jugador). Cada Motor puede leer solo los eventos que necesita.
export type DomainEventType =
  | "ChronicleGenerated"
  | "EntityDiscovered"
  | "EntityEvolved"
  | "RealmChanged"
  | "AchievementUnlocked"
  | "OracleFailed";

const SCHEMA_VERSION = 1;
const RULES_VERSION = "event-engine-001";

export async function emitEvent(playerId: string, type: DomainEventType, payload: Record<string, unknown>, occurredAt: Date): Promise<void> {
  const { error } = await createServiceSupabaseClient()
    .from("world_events")
    .insert({ player_id: playerId, event_type: type, schema_version: SCHEMA_VERSION, rules_version: RULES_VERSION, payload, occurred_at: occurredAt.toISOString() });
  if (error) throw new Error(`Could not emit event ${type}: ${error.message}`);
}
