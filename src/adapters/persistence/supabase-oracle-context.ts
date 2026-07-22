import type { OracleContext } from "../../core/ports/oracle-agent.ts";
import { createServiceSupabaseClient } from "./supabase-server.ts";

export async function loadOracleContextFromSupabase(playerId: string): Promise<OracleContext> {
  const supabase = createServiceSupabaseClient();
  const [stats, entities, contracts, bosses] = await Promise.all([
    supabase.from("player_stats").select("stat_key, value").eq("player_id", playerId),
    supabase.from("world_entities").select("id, entity_type, canonical_name, aliases").eq("player_id", playerId).is("merged_into_entity_id", null).limit(50),
    supabase.from("contracts").select("id").eq("player_id", playerId).eq("state", "activo"),
    supabase.from("bosses").select("id").eq("player_id", playerId).in("state", ["descubierto", "activo", "debilitado"])
  ]);
  for (const result of [stats, entities, contracts, bosses]) if (result.error) throw new Error(`Could not load Oracle context: ${result.error.message}`);
  const activeStats = Object.fromEntries((stats.data ?? []).map((row) => [row.stat_key as string, Number(row.value)]));
  return { language: "es-MX", activeStats, relevantEntities: (entities.data ?? []).map((row) => ({ id: row.id as string, type: row.entity_type as string, name: row.canonical_name as string, aliases: (row.aliases as string[]) ?? [] })), activeContractIds: (contracts.data ?? []).map((row) => row.id as string), activeBossIds: (bosses.data ?? []).map((row) => row.id as string) };
}
