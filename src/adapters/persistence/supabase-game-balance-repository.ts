import type { ActiveBalanceTable, GameBalanceRepository } from "../../core/ports/game-balance-repository.ts";
import { createServiceSupabaseClient } from "./supabase-server.ts";

export class SupabaseGameBalanceRepository implements GameBalanceRepository {
  async getActive(tableKey: string): Promise<ActiveBalanceTable | null> {
    const { data, error } = await createServiceSupabaseClient().from("game_balance_tables").select("table_key, version, payload, activated_at").eq("table_key", tableKey).eq("status", "activa").order("version", { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error(`Could not load game balance ${tableKey}: ${error.message}`);
    return data ? { tableKey: data.table_key, version: data.version, payload: data.payload, activatedAt: data.activated_at ? new Date(data.activated_at) : null } : null;
  }
}
