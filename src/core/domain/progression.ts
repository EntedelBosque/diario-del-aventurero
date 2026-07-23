import { CORE_STAT_KEYS, type CoreStatKey } from "./adventurer.ts";

// Escala compacta 1–10 por actividad: cada componente aporta poco para que los totales
// crezcan de forma lenta y legible (nunca "+65 de golpe"). Máximo normal por actividad = 10.
export const ACTIVITY_BASE_XP = {
  muy_pequena: 1,
  pequena: 2,
  media: 3,
  importante: 4,
  extraordinaria: 5,
  historica: 6
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
};

export function calculateExperience(activity: ProgressActivity): ExperienceBreakdown {
  validateActivity(activity);
  const baseXp = ACTIVITY_BASE_XP[activity.scale];
  const timeXp = calculateTimeBonus(activity.durationMinutes);
  const peopleXp = activity.participants.length > 0 ? 1 : 0;
  const discoveryXp = activity.discoveries.some((discovery) => discovery.isFirstDiscovery) ? 1 : 0;
  const totalXp = baseXp + timeXp + peopleXp + discoveryXp + activity.bonusXp;

  return {
    baseXp,
    timeXp,
    peopleXp,
    discoveryXp,
    bonusXp: activity.bonusXp,
    totalXp
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
  if (minutes <= 60) return minutes <= 30 ? 0 : 1;
  return minutes <= 240 ? 1 : 2;
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
