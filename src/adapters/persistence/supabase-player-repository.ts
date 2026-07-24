import { createServiceSupabaseClient } from "./supabase-server.ts";

// El RPC del Motor no incrementa las estadísticas base (solo XP, monedas, gremios y disciplina).
// Aquí acreditamos las estadísticas núcleo (arte/tecnologia/vitalidad/social/sabiduria) desde las
// clasificaciones de las actividades. Read-modify-write: suficiente para un único jugador.
export async function incrementPlayerStats(playerId: string, deltas: Record<string, number>): Promise<void> {
  const entries = Object.entries(deltas).filter(([, value]) => value > 0);
  if (entries.length === 0) return;
  const supabase = createServiceSupabaseClient();
  const keys = entries.map(([key]) => key);
  const { data, error } = await supabase.from("player_stats").select("stat_key, value").eq("player_id", playerId).in("stat_key", keys);
  if (error) throw new Error(`Could not read player stats: ${error.message}`);
  const current = new Map((data ?? []).map((row) => [row.stat_key as string, Number(row.value)]));
  const rows = entries.map(([stat_key, delta]) => ({ player_id: playerId, stat_key, value: (current.get(stat_key) ?? 0) + delta, updated_at: new Date().toISOString() }));
  const { error: upsertError } = await supabase.from("player_stats").upsert(rows, { onConflict: "player_id,stat_key" });
  if (upsertError) throw new Error(`Could not update player stats: ${upsertError.message}`);
}

// Disciplina (0–100): sube +1 por cada entrada del diario (peso journal_entry). El decaimiento por
// inactividad (missed_day/inactive_week) es una mejora futura que requiere un trabajo programado.
export async function bumpDiscipline(playerId: string, delta: number): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("player_stats").select("value").eq("player_id", playerId).eq("stat_key", "disciplina").maybeSingle();
  if (error) throw new Error(`Could not read discipline: ${error.message}`);
  const next = Math.max(0, Math.min(100, Number(data?.value ?? 50) + delta));
  const { error: upsertError } = await supabase.from("player_stats").upsert({ player_id: playerId, stat_key: "disciplina", value: next, updated_at: new Date().toISOString() }, { onConflict: "player_id,stat_key" });
  if (upsertError) throw new Error(`Could not update discipline: ${upsertError.message}`);
}

// Reparte la XP de una actividad entre sus estadísticas por peso (mayor-resto: conserva el total en enteros).
export function allocateStatGains(activities: Array<{ totalXp: number; classifications: Array<{ stat: string; weight: number }> }>): Record<string, number> {
  const deltas: Record<string, number> = {};
  for (const activity of activities) {
    const provisional = activity.classifications.map((classification) => {
      const exact = (activity.totalXp * classification.weight) / 100;
      return { stat: classification.stat, amount: Math.floor(exact), remainder: exact % 1 };
    });
    let remaining = activity.totalXp - provisional.reduce((total, item) => total + item.amount, 0);
    provisional.sort((left, right) => right.remainder - left.remainder);
    for (let index = 0; index < remaining && provisional.length > 0; index += 1) provisional[index % provisional.length].amount += 1;
    for (const item of provisional) deltas[item.stat] = (deltas[item.stat] ?? 0) + item.amount;
  }
  return deltas;
}
