export type DirectorSnapshot = {
  playerId: string;
  observedAt: Date;
  activeContractCount: number;
  maximumActiveContracts: number;
  neglectedCategories: string[];
  recoveryNeeded: boolean;
  activeBossIds: string[];
  seasonalSignal?: string;
};

export type DirectorProposal =
  | { type: "reduce_load"; reason: string }
  | { type: "recovery_contract"; reason: string; difficulty: "muy_facil" }
  | { type: "balance_contract"; category: string; reason: string }
  | { type: "boss_review"; bossId: string; reason: string }
  | { type: "seasonal_event_review"; signal: string };

export function evaluateGameDirector(snapshot: DirectorSnapshot): DirectorProposal[] {
  validateSnapshot(snapshot);
  const proposals: DirectorProposal[] = [];
  const capacityReached = snapshot.activeContractCount >= snapshot.maximumActiveContracts;

  if (capacityReached) {
    proposals.push({ type: "reduce_load", reason: "La carga activa alcanzo el limite configurado" });
  } else if (snapshot.recoveryNeeded) {
    proposals.push({ type: "recovery_contract", reason: "El Motor detecto necesidad de recuperacion", difficulty: "muy_facil" });
  } else {
    for (const category of uniqueSorted(snapshot.neglectedCategories)) {
      proposals.push({ type: "balance_contract", category, reason: "El Motor detecto un area descuidada" });
    }
  }

  for (const bossId of uniqueSorted(snapshot.activeBossIds)) proposals.push({ type: "boss_review", bossId, reason: "Revision estrategica de boss activo" });
  if (snapshot.seasonalSignal?.trim()) proposals.push({ type: "seasonal_event_review", signal: snapshot.seasonalSignal.trim() });
  return proposals;
}

function validateSnapshot(snapshot: DirectorSnapshot): void {
  if (!Number.isSafeInteger(snapshot.activeContractCount) || snapshot.activeContractCount < 0) throw new Error("activeContractCount must be a non-negative integer");
  if (!Number.isSafeInteger(snapshot.maximumActiveContracts) || snapshot.maximumActiveContracts < 0) throw new Error("maximumActiveContracts must be a non-negative integer");
  if (Number.isNaN(snapshot.observedAt.getTime())) throw new Error("observedAt must be a valid date");
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right));
}
