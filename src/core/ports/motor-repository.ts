import type { StoredDiaryEntry } from "./diary-entry-repository.ts";

export type MotorActivityEffect = { category: string; scale: string; durationMinutes: number; classifications: unknown; baseXp: number; timeXp: number; peopleXp: number; discoveryXp: number; bonusXp: number; totalXp: number; guildAwards: Array<{ guildCode: string; experience: number }> };
export type MotorEffects = { playerId: string; worldEventId: string; rulesVersion: string; playerExperience: number; playerLevel: number; activities: MotorActivityEffect[]; contractEvidence: Array<{ contractId: string; rationale: string }>; bossEvidence: Array<{ bossId: string; rationale: string }>; entry: StoredDiaryEntry };

export interface MotorRepository {
  resolveGuildCodes(category: string): Promise<string[]>;
  persistAtomically(effects: MotorEffects): Promise<void>;
}
