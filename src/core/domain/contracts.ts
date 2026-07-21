import { CORE_STAT_KEYS, type CoreStatKey } from "./adventurer.ts";

export const CONTRACT_TYPES = ["diario", "semanal", "mensual", "campana", "gran_destino", "obra_magna", "especial", "recuperacion", "dinamico"] as const;
export const CONTRACT_STATES = ["disponible", "activo", "completado", "fallido", "expirado", "cancelado", "archivado"] as const;
export const CONTRACT_DIFFICULTIES = ["muy_facil", "facil", "normal", "dificil", "heroico", "legendario"] as const;
export const CONTRACT_PRIORITIES = ["baja", "media", "alta", "critica"] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number];
export type ContractState = (typeof CONTRACT_STATES)[number];
export type ContractDifficulty = (typeof CONTRACT_DIFFICULTIES)[number];
export type ContractPriority = (typeof CONTRACT_PRIORITIES)[number];
export type ContractOrigin = "manual" | "motor";

export type ContractReward = {
  experience?: number;
  adventurerCoins?: number;
  statProgress?: Partial<Record<CoreStatKey, number>>;
  guildExperience?: Partial<Record<CoreStatKey, number>>;
  greatDestinationProgress?: number;
  masterWorkProgress?: number;
  itemIds?: string[];
  achievementIds?: string[];
};

export type Contract = {
  id: string;
  playerId: string;
  type: ContractType;
  objective: string;
  state: ContractState;
  difficulty: ContractDifficulty;
  priority: ContractPriority;
  categories: string[];
  origin: ContractOrigin;
  rewards: ContractReward;
  startsAt: Date;
  expiresAt: Date;
  parentContractId?: string;
};

export function createContract(contract: Contract): Contract {
  if (contract.objective.trim().length === 0) throw new Error("contract objective is required");
  if (contract.categories.length === 0) throw new Error("a contract needs at least one category");
  if (new Set(contract.categories).size !== contract.categories.length) throw new Error("contract categories must be unique");
  if (contract.expiresAt <= contract.startsAt) throw new Error("contract expiry must be after its start");
  if (!hasReward(contract.rewards)) throw new Error("every contract requires a reward");
  validateStandardDuration(contract.type, contract.startsAt, contract.expiresAt);
  return { ...contract, objective: contract.objective.trim(), categories: contract.categories.map((category) => category.trim()) };
}

export function transitionContract(contract: Contract, nextState: ContractState, evidenceEventIds: string[] = []): Contract {
  if (nextState === "completado" && evidenceEventIds.length === 0) throw new Error("contract completion requires recorded evidence");
  if (!allowedTransitions[contract.state].includes(nextState)) throw new Error(`cannot transition ${contract.state} to ${nextState}`);
  return { ...contract, state: nextState };
}

export function expireContractIfDue(contract: Contract, at: Date): Contract {
  if ((contract.state === "disponible" || contract.state === "activo") && at >= contract.expiresAt) return { ...contract, state: "expirado" };
  return contract;
}

const allowedTransitions: Readonly<Record<ContractState, ContractState[]>> = {
  disponible: ["activo", "cancelado", "archivado", "expirado"],
  activo: ["completado", "fallido", "expirado", "cancelado", "archivado"],
  completado: ["archivado"], fallido: ["archivado"], expirado: ["archivado"], cancelado: ["archivado"], archivado: []
};

function hasReward(reward: ContractReward): boolean {
  return Object.values(reward).some((value) => Array.isArray(value) ? value.length > 0 : typeof value === "object" && value !== null ? Object.values(value).some((amount) => amount > 0) : typeof value === "number" && value > 0);
}

function validateStandardDuration(type: ContractType, startsAt: Date, expiresAt: Date): void {
  const expectedHours = type === "diario" ? 24 : type === "semanal" ? 24 * 7 : type === "mensual" ? 24 * 30 : undefined;
  if (expectedHours !== undefined && expiresAt.getTime() - startsAt.getTime() !== expectedHours * 60 * 60 * 1000) {
    throw new Error(`${type} contracts must use their official duration`);
  }
}
