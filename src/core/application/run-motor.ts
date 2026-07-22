import { calculateExperience, levelForExperience } from "../domain/progression.ts";
import { allocateGuildExperience } from "../domain/guilds.ts";
import { requireActiveBalanceTable, type GameBalanceRepository } from "../ports/game-balance-repository.ts";
import type { MotorEffects, MotorRepository } from "../ports/motor-repository.ts";
import type { StoredDiaryEntry } from "../ports/diary-entry-repository.ts";

export class RunMotor {
  constructor(private readonly repository: MotorRepository, private readonly balance: GameBalanceRepository) {}

  async execute(entry: StoredDiaryEntry): Promise<MotorEffects> {
    if (entry.oracleStatus !== "accepted" || !entry.oracleResponse || !entry.worldEventId) throw new Error("Motor requires an accepted Oracle response with a world event");
    const balances = await Promise.all(["player_level_curve", "guild_level_curve", "boss_damage_curve", "discipline_weights", "director_thresholds"].map((key) => requireActiveBalanceTable(this.balance, key)));
    const rulesVersion = balances.map((table) => `${table.tableKey}@${table.version}`).join(",");
    const activities = [];
    let awardedExperience = 0;
    for (const activity of entry.oracleResponse.activities) {
      const guildCodes = await this.repository.resolveGuildCodes(activity.category);
      if (guildCodes.length === 0) throw new Error(`No active guild is configured for category: ${activity.category}`);
      const experience = calculateExperience({ scale: activity.scale, durationMinutes: activity.durationMinutes, classifications: activity.classifications, discoveries: [], participants: [], bonusXp: 0 });
      const weight = 100 / guildCodes.length;
      if (!Number.isInteger(weight)) throw new Error(`Category ${activity.category} maps to guilds that cannot share an integer weight`);
      const guildAllocation = allocateGuildExperience(experience.totalXp, guildCodes.map((guildCode) => ({ guildCode: guildCode as never, weight })));
      activities.push({ category: activity.category, scale: activity.scale, durationMinutes: activity.durationMinutes, classifications: activity.classifications, ...experience, guildAwards: Object.entries(guildAllocation).filter(([, amount]) => amount > 0).map(([guildCode, amount]) => ({ guildCode, experience: amount })) });
      awardedExperience += experience.totalXp;
    }
    const playerExperience = awardedExperience;
    const effects: MotorEffects = { playerId: entry.playerId, worldEventId: entry.worldEventId, rulesVersion, playerExperience, playerLevel: levelForExperience(playerExperience), activities, contractEvidence: entry.oracleResponse.contractEvidence, bossEvidence: entry.oracleResponse.bossEvidence, entry };
    await this.repository.persistAtomically(effects);
    return effects;
  }
}
