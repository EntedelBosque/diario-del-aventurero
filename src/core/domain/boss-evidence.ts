export type BossEvidenceRecord = { bossId: string; points: number; recordedAt: Date };
export type BossEvidenceReset = { bossId: string; resetAt: Date; reason: "derrotado" | "archivado" };

/**
 * Returns only the evidence that remains operational after the latest reset.
 * Evidence rows are never changed or deleted; a reset is an auditable cutoff.
 */
export function operationalBossEvidence(bossId: string, appearedAt: Date, evidence: BossEvidenceRecord[], resets: BossEvidenceReset[]): number {
  if (bossId.trim().length === 0 || Number.isNaN(appearedAt.getTime())) throw new Error("bossId and appearedAt are required");
  const latestReset = resets
    .filter((reset) => reset.bossId === bossId)
    .reduce<Date | undefined>((latest, reset) => !latest || reset.resetAt > latest ? reset.resetAt : latest, undefined);
  const cutoff = latestReset ?? appearedAt;
  return evidence.reduce((total, item) => {
    if (item.bossId !== bossId || item.recordedAt <= cutoff) return total;
    if (!Number.isSafeInteger(item.points) || item.points <= 0) throw new Error("evidence points must be positive integers");
    return total + item.points;
  }, 0);
}
