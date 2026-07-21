export const ADVENTURER_CURRENCY = "monedas_aventurero";
export const MARKET_REWARD_STATUSES = ["activa", "inactiva", "archivada"] as const;

export type MarketRewardStatus = (typeof MARKET_REWARD_STATUSES)[number];
export type CurrencySource = "contrato_completado" | "boss_derrotado" | "gran_destino_completado" | "obra_magna" | "evento_especial" | "logro" | "bonificacion_motor";

export type MarketReward = {
  id: string;
  playerId: string;
  name: string;
  description: string;
  cost: number;
  category: string;
  status: MarketRewardStatus;
};

export type CurrencyAward = {
  amount: number;
  source: CurrencySource;
  sourceId: string;
};

export function createMarketReward(reward: MarketReward): MarketReward {
  if (reward.name.trim().length === 0 || reward.description.trim().length === 0 || reward.category.trim().length === 0) throw new Error("market reward name, description and category are required");
  if (!Number.isSafeInteger(reward.cost) || reward.cost <= 0) throw new Error("market reward cost must be a positive integer");
  return { ...reward, name: reward.name.trim(), description: reward.description.trim(), category: reward.category.trim() };
}

export function awardCurrencyFromMotor(balance: number, award: CurrencyAward): number {
  validateBalance(balance);
  if (!Number.isSafeInteger(award.amount) || award.amount <= 0 || award.sourceId.trim().length === 0) throw new Error("currency awards require a valid action and positive amount");
  return balance + award.amount;
}

export function redeemMarketReward(balance: number, reward: MarketReward): number {
  validateBalance(balance);
  if (reward.status !== "activa") throw new Error("only active market rewards can be redeemed");
  if (balance < reward.cost) throw new Error("insufficient Adventurer Coins");
  return balance - reward.cost;
}

function validateBalance(balance: number): void {
  if (!Number.isSafeInteger(balance) || balance < 0) throw new Error("balance must be a non-negative integer");
}
