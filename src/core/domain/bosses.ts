export const BOSS_STATES = ["descubierto", "activo", "debilitado", "derrotado", "archivado"] as const;
export const BOSS_DIFFICULTIES = ["normal", "epico", "legendario", "mitico"] as const;
export const INITIAL_BOSS_CATEGORIES = ["vitalidad", "tecnologia", "arte", "social", "sabiduria", "finanzas", "viajes", "profesion", "personal"] as const;

export type BossState = (typeof BOSS_STATES)[number];
export type BossDifficulty = (typeof BOSS_DIFFICULTIES)[number];
export type Boss = {
  id: string;
  playerId: string;
  name: string;
  description: string;
  categories: string[];
  level: number;
  maxHealth: number;
  currentHealth: number;
  difficulty: BossDifficulty;
  state: BossState;
  appearedAt: Date;
  estimatedAt?: Date;
  rewards: Record<string, unknown>;
};

export type MotorBossDamage = {
  amount: number;
  sourceEventIds: string[];
  completedContractIds: string[];
};

export function createBoss(boss: Boss): Boss {
  if (boss.name.trim().length === 0 || boss.description.trim().length === 0) throw new Error("boss name and description are required");
  if (boss.categories.length === 0 || new Set(boss.categories).size !== boss.categories.length) throw new Error("boss needs unique categories");
  if (!Number.isSafeInteger(boss.level) || boss.level < 1) throw new Error("boss level must be a positive integer");
  if (!Number.isSafeInteger(boss.maxHealth) || boss.maxHealth <= 0 || !Number.isSafeInteger(boss.currentHealth) || boss.currentHealth < 0 || boss.currentHealth > boss.maxHealth) throw new Error("boss health is invalid");
  return { ...boss, name: boss.name.trim(), description: boss.description.trim() };
}

export function activateBoss(boss: Boss): Boss {
  if (boss.state !== "descubierto") throw new Error("only discovered bosses can activate");
  return { ...boss, state: "activo" };
}

export function applyMotorBossDamage(boss: Boss, damage: MotorBossDamage): Boss {
  if (boss.state !== "activo" && boss.state !== "debilitado") throw new Error("only active bosses can receive damage");
  if (!Number.isSafeInteger(damage.amount) || damage.amount <= 0) throw new Error("boss damage must be a positive integer");
  if (damage.sourceEventIds.length === 0 && damage.completedContractIds.length === 0) throw new Error("boss damage requires validated evidence");

  const currentHealth = Math.max(0, boss.currentHealth - damage.amount);
  const state: BossState = currentHealth === 0 ? "derrotado" : "debilitado";
  return { ...boss, currentHealth, state };
}

export function archiveBoss(boss: Boss): Boss {
  if (boss.state !== "derrotado") throw new Error("only defeated bosses can archive");
  return { ...boss, state: "archivado" };
}
