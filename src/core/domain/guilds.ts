export const OFFICIAL_GUILD_CODES = ["forja_acero", "atelier_bosque", "orden_roble", "caminantes_horizonte", "archivo_eterno", "vinculos_reino"] as const;
export type OfficialGuildCode = (typeof OFFICIAL_GUILD_CODES)[number];
export type GuildProgress = { guildCode: OfficialGuildCode; experience: number; level: number; mastery: number };
export type GuildExperienceAllocation = { guildCode: OfficialGuildCode; weight: number };

export function allocateGuildExperience(totalExperience: number, allocations: GuildExperienceAllocation[]): Record<OfficialGuildCode, number> {
  if (!Number.isSafeInteger(totalExperience) || totalExperience < 0) throw new Error("totalExperience must be a non-negative integer");
  if (allocations.length === 0) throw new Error("an activity needs at least one guild allocation");
  const codes = new Set<OfficialGuildCode>();
  let totalWeight = 0;
  for (const allocation of allocations) {
    if (!OFFICIAL_GUILD_CODES.includes(allocation.guildCode) || !Number.isSafeInteger(allocation.weight) || allocation.weight <= 0) throw new Error("guild allocations must use an official guild and positive integer weight");
    if (codes.has(allocation.guildCode)) throw new Error("a guild may only appear once per allocation");
    codes.add(allocation.guildCode); totalWeight += allocation.weight;
  }
  if (totalWeight !== 100) throw new Error("guild allocation weights must add up to 100");
  const result = Object.fromEntries(OFFICIAL_GUILD_CODES.map((code) => [code, 0])) as Record<OfficialGuildCode, number>;
  const provisional = allocations.map((allocation, index) => { const exact = (totalExperience * allocation.weight) / 100; return { ...allocation, index, amount: Math.floor(exact), remainder: exact % 1 }; });
  let remaining = totalExperience;
  for (const item of provisional) { result[item.guildCode] = item.amount; remaining -= item.amount; }
  provisional.sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  for (let index = 0; index < remaining; index += 1) result[provisional[index].guildCode] += 1;
  return result;
}

export function awardGuildExperience(progress: GuildProgress, experience: number): GuildProgress {
  if (!Number.isSafeInteger(experience) || experience <= 0) throw new Error("guild experience must be a positive integer");
  if (!Number.isSafeInteger(progress.experience) || progress.experience < 0 || !Number.isSafeInteger(progress.mastery) || progress.mastery < 0 || !Number.isSafeInteger(progress.level) || progress.level < 1) throw new Error("guild progress is invalid");
  return { ...progress, experience: progress.experience + experience, mastery: progress.mastery + experience };
}
