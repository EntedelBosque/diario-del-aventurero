import type { EntitySuggestion } from "../../core/domain/world-memory.ts";
import { createServiceSupabaseClient } from "./supabase-server.ts";

export type WorldEntityView = { id: string; type: string; name: string; aliases: string[]; category: string | null; observations: string | null };

// Escribe las entidades sugeridas por la Oráculo en la memoria del mundo.
// Idempotente: si la entidad ya existe (mismo jugador/tipo/nombre), se conserva la original
// (no se sobrescribe su descubrimiento). Un merge/alias más rico queda como trabajo futuro.
export async function persistWorldEntities(playerId: string, worldEventId: string, occurredAt: Date, suggestions: EntitySuggestion[]): Promise<void> {
  if (suggestions.length === 0) return;
  const rows = suggestions.map((suggestion) => ({
    player_id: playerId,
    entity_type: suggestion.type,
    canonical_name: suggestion.name,
    aliases: suggestion.alias ? [suggestion.alias] : [],
    category: suggestion.category ?? null,
    discovery_event_id: worldEventId,
    discovered_at: occurredAt.toISOString(),
    last_interaction_at: occurredAt.toISOString()
  }));
  const { error } = await createServiceSupabaseClient()
    .from("world_entities")
    .upsert(rows, { onConflict: "player_id,entity_type,canonical_name", ignoreDuplicates: true });
  if (error) throw new Error(`Could not persist world entities: ${error.message}`);
}

export async function listWorldEntities(playerId: string): Promise<WorldEntityView[]> {
  const { data, error } = await createServiceSupabaseClient()
    .from("world_entities")
    .select("id, entity_type, canonical_name, aliases, category, observations")
    .eq("player_id", playerId)
    .is("merged_into_entity_id", null)
    .order("discovered_at", { ascending: false });
  if (error) throw new Error(`Could not list world entities: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    type: row.entity_type as string,
    name: row.canonical_name as string,
    aliases: (row.aliases as string[] | null) ?? [],
    category: (row.category as string | null) ?? null,
    observations: (row.observations as string | null) ?? null
  }));
}
