import type { MotorEffects, MotorRepository } from "../../core/ports/motor-repository.ts";
import { createServiceSupabaseClient } from "./supabase-server.ts";

export class SupabaseMotorRepository implements MotorRepository {
  async resolveGuildCodes(category: string): Promise<string[]> {
    const normalized = category.trim().toLowerCase();
    const { data, error } = await createServiceSupabaseClient().from("guild_categories").select("guild_code, guilds!inner(is_active)").eq("category", normalized).eq("guilds.is_active", true);
    if (error) throw new Error(`Could not resolve guild category: ${error.message}`);
    return (data ?? []).map((row) => row.guild_code as string);
  }
  async persistAtomically(effects: MotorEffects): Promise<void> {
    const { error } = await createServiceSupabaseClient().rpc("persist_motor_effects", { p_world_event_id: effects.worldEventId, p_player_id: effects.playerId, p_rules_version: effects.rulesVersion, p_effects: effects });
    if (error) throw new Error(`Could not persist Motor effects: ${error.message}`);
  }
}
