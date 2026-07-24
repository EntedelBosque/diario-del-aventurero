import type { DirectorRepository } from "../../core/ports/director-repository.ts";
import type { DirectorSnapshot, DirectorProposal } from "../../core/domain/game-director.ts";
import { createServiceSupabaseClient } from "./supabase-server.ts";
import { formatAdventurerTimestamp } from "../../shared/format-date.ts";

const CORE_STATS = ["arte", "tecnologia", "vitalidad", "social", "sabiduria"];
const NEGLECT_MARGIN = 20;      // una categoría rezagada >=20 respecto a la líder cuenta como descuidada
const RECOVERY_DISCIPLINE = 40; // disciplina "Variable/Inestable" sugiere necesidad de recuperación
const DEFAULT_MAX_CONTRACTS = 5;
const RULES_VERSION = "director-001";

function keyOf(payload: Record<string, unknown> | null): string {
  const source = payload ?? {};
  return String(source.category ?? source.bossId ?? source.signal ?? "");
}

export class SupabaseDirectorRepository implements DirectorRepository {
  private readonly supabase = createServiceSupabaseClient();

  async loadSnapshot(playerId: string): Promise<DirectorSnapshot> {
    const [stats, contracts, bosses, thresholds] = await Promise.all([
      this.supabase.from("player_stats").select("stat_key, value").eq("player_id", playerId),
      this.supabase.from("contracts").select("id").eq("player_id", playerId).eq("state", "activo"),
      this.supabase.from("bosses").select("id").eq("player_id", playerId).in("state", ["descubierto", "activo", "debilitado"]),
      this.supabase.from("game_balance_tables").select("payload").eq("table_key", "director_thresholds").eq("status", "activa").maybeSingle()
    ]);
    for (const result of [stats, contracts, bosses]) if (result.error) throw new Error(`Director could not load snapshot: ${result.error.message}`);

    const statValues = new Map((stats.data ?? []).map((row) => [row.stat_key as string, Number(row.value)]));
    const coreValues = CORE_STATS.map((key) => statValues.get(key) ?? 0);
    const leader = Math.max(...coreValues);
    const neglectedCategories = CORE_STATS.filter((key) => leader - (statValues.get(key) ?? 0) >= NEGLECT_MARGIN);
    const discipline = statValues.get("disciplina") ?? 50;
    const maximumActiveContracts = Number((thresholds.data?.payload as { max_active_contracts?: number } | null)?.max_active_contracts ?? DEFAULT_MAX_CONTRACTS);
    const seasonalSignal = formatAdventurerTimestamp(new Date()).celestialEvent;

    return {
      playerId,
      observedAt: new Date(),
      activeContractCount: (contracts.data ?? []).length,
      maximumActiveContracts,
      neglectedCategories,
      recoveryNeeded: discipline < RECOVERY_DISCIPLINE,
      activeBossIds: (bosses.data ?? []).map((row) => row.id as string),
      seasonalSignal: seasonalSignal ? seasonalSignal.toLowerCase().replace(/\s+/g, "_") : undefined
    };
  }

  async recordObservation(snapshot: DirectorSnapshot): Promise<string> {
    const { data, error } = await this.supabase
      .from("director_observations")
      .insert({ player_id: snapshot.playerId, cadence: "evento", snapshot, rules_version: RULES_VERSION })
      .select("id")
      .single();
    if (error) throw new Error(`Director could not record observation: ${error.message}`);
    return data.id as string;
  }

  async recordProposal(observationId: string, proposal: DirectorProposal): Promise<void> {
    const { type, ...payload } = proposal;
    // Dedup: no crear una propuesta abierta idéntica (mismo tipo + categoría/boss/señal) en cada entrada.
    const key = keyOf(payload);
    const { data: open, error: readError } = await this.supabase.from("director_proposals").select("payload").eq("status", "propuesta").eq("proposal_type", type);
    if (readError) throw new Error(`Director could not read proposals: ${readError.message}`);
    if ((open ?? []).some((row) => keyOf(row.payload as Record<string, unknown>) === key)) return;
    const { error } = await this.supabase
      .from("director_proposals")
      .insert({ observation_id: observationId, proposal_type: type, payload, status: "propuesta" });
    if (error) throw new Error(`Director could not record proposal: ${error.message}`);
  }
}
