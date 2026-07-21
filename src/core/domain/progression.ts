import { CORE_STAT_KEYS, type CoreStatKey } from "./adventurer.ts";

export const ACTIVITY_BASE_XP = {
  muy_pequena: 10,
  pequena: 20,
  media: 35,
  importante: 60,
  extraordinaria: 100,
  historica: 150
} as const;

export type ActivityScale = keyof typeof ACTIVITY_BASE_XP;
export type DiscoveryType = "lugar" | "herramienta" | "personaje" | "conocimiento" | "habilidad";
export type ParticipantImportance = "conocida" | "importante";

export type ProgressActivity = {
  scale: ActivityScale;
  durationMinutes: number;
  classifications: Array<{ stat: CoreStatKey; weight: number }>;
  discoveries: Array<{ type: DiscoveryType; isFirstDiscovery: boolean }>;
  participants: Array<{ importance: ParticipantImportance }>;
  bonusXp: number;
};

export type ExperienceBreakdown = {
  baseXp: number;
  timeXp: number;
  peopleXp: number;
  discoveryXp: number;
  bonusXp: number;
  totalXp: number;
  guildXpAllocations: Record<CoreStatKey, number>;
};

const DISCOVERY_XP: Readonly<Record<DiscoveryType, number>> = {
  lugar: 10,
  herramienta: 20,
  personaje: 15,
  conocimiento: 20,
  habilidad: 25
};

export function calculateExperience(activity: ProgressActivity): ExperienceBreakdown {
  validateActivity(activity);
  const baseXp = ACTIVITY_BASE_XP[activity.scale];
  const timeXp = calculateTimeBonus(activity.durationMinutes);
  const peopleXp = activity.participants.reduce((total, participant) => total + (participant.importance === "importante" ? 8 : 5), 0);
  const discoveryXp = activity.discoveries.reduce((total, discovery) => total + (discovery.isFirstDiscovery ? DISCOVERY_XP[discovery.type] : 0), 0);
  const totalXp = baseXp + timeXp + peopleXp + discoveryXp + activity.bonusXp;

  return {
    baseXp,
    timeXp,
    peopleXp,
    discoveryXp,
    bonusXp: activity.bonusXp,
    totalXp,
    guildXpAllocations: allocateToGuilds(totalXp, activity.classifications)
  };
}

export function experienceRequiredForNextLevel(currentLevel: number): number {
  if (!Number.isSafeInteger(currentLevel) || currentLevel < 1) throw new Error("currentLevel must be a positive integer");
  return Math.ceil(100 * currentLevel ** 1.5);
}

export function levelForExperience(totalExperience: number): number {
  if (!Number.isSafeInteger(totalExperience) || totalExperience < 0) throw new Error("totalExperience must be a non-negative integer");
  let level = 1;
  while (totalExperience >= experienceRequiredForNextLevel(level)) level += 1;
  return level;
}

function calculateTimeBonus(minutes: number): number {
  if (!Number.isSafeInteger(minutes) || minutes < 0) throw new Error("durationMinutes must be a non-negative integer");
  if (minutes <= 30) return 5;
  if (minutes <= 60) return 10;
  if (minutes <= 120) return 20;
  if (minutes <= 240) return 35;
  return 50;
}

function allocateToGuilds(totalXp: number, classifications: ProgressActivity["classifications"]): Record<CoreStatKey, number> {
  const allocations = Object.fromEntries(CORE_STAT_KEYS.map((stat) => [stat, 0])) as Record<CoreStatKey, number>;
  const provisional = classifications.map((classification, index) => {
    const exact = (totalXp * classification.weight) / 100;
    return { ...classification, index, amount: Math.floor(exact), remainder: exact % 1 };
  });
  let unallocated = totalXp;
  for (const item of provisional) {
    allocations[item.stat] = item.amount;
    unallocated -= item.amount;
  }
  provisional.sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  for (let index = 0; index < unallocated; index += 1) allocations[provisional[index].stat] += 1;
  return allocations;
}

function validateActivity(activity: ProgressActivity): void {
  if (!Number.isSafeInteger(activity.bonusXp) || activity.bonusXp < 0) throw new Error("bonusXp must be a non-negative integer");
  if (activity.classifications.length === 0) throw new Error("an activity needs at least one classification");
  const seenStats = new Set<CoreStatKey>();
  const totalWeight = activity.classifications.reduce((total, classification) => {
    if (!CORE_STAT_KEYS.includes(classification.stat) || !Number.isSafeInteger(classification.weight) || classification.weight <= 0) {
      throw new Error("classifications must use a core statistic and a positive integer weight");
    }
    if (seenStats.has(classification.stat)) throw new Error("a statistic may only appear once per activity");
    seenStats.add(classification.stat);
    return total + classification.weight;
  }, 0);
  if (totalWeight !== 100) throw new Error("classification weights must add up to 100");
}
