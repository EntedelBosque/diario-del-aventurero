import { CORE_STAT_KEYS, type CoreStatKey } from "./adventurer.ts";
import { ACTIVITY_BASE_XP, type ActivityScale } from "./progression.ts";
import { normalizeEntityName, type EntitySuggestion } from "./world-memory.ts";

export const STAT_KEYS = CORE_STAT_KEYS;

export type StatKey = CoreStatKey;

export type OracleResponse = {
  summary: string;
  narrative: string;
  stats: Record<StatKey, number>;
  newCharacters: Array<{ name: string; alias: string; role: string }>;
  newKnowledge: Array<{ name: string; category: string }>;
  contractEvidence: Array<{ contractId: string; rationale: string }>;
  bossDamage: Array<{ boss_id: string; amount: number; source_stat: string }>;
  activities: Array<{ scale: ActivityScale; durationMinutes: number; classifications: Array<{ stat: StatKey; weight: number }> }>;
  entitySuggestions: EntitySuggestion[];
};

export type OracleValidation =
  | { ok: true; value: OracleResponse }
  | { ok: false; errors: string[] };

export function validateOracleResponse(value: unknown): OracleValidation {
  if (!isRecord(value)) return invalid("The response must be an object");

  const errors: string[] = [];
  const summary = readText(value.summary, "summary", errors);
  const narrative = readText(value.narrative, "narrative", errors);
  const stats = readStats(value.stats, errors);
  const newCharacters = readCharacters(value.newCharacters, errors);
  const newKnowledge = readKnowledge(value.newKnowledge, errors);
  const contractEvidence = readContractEvidence(value.contractEvidence, errors);
  const bossDamage = readBossDamage(value.bossDamage, errors);
  const activities = readActivities(value.activities, errors);
  const entitySuggestions = readEntitySuggestions(value.entitySuggestions, errors);

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: { summary, narrative, stats, newCharacters, newKnowledge, contractEvidence, bossDamage, activities, entitySuggestions }
  };
}

function readContractEvidence(value: unknown, errors: string[]): OracleResponse["contractEvidence"] {
  if (!Array.isArray(value)) {
    errors.push("contractEvidence must be an array");
    return [];
  }
  return value.flatMap((item, index) => {
    if (!isRecord(item)) {
      errors.push(`contractEvidence[${index}] must be an object`);
      return [];
    }
    return [{ contractId: readText(item.contractId, `contractEvidence[${index}].contractId`, errors), rationale: readText(item.rationale, `contractEvidence[${index}].rationale`, errors) }];
  });
}

function readEntitySuggestions(value: unknown, errors: string[]): EntitySuggestion[] {
  if (!Array.isArray(value)) {
    errors.push("entitySuggestions must be an array");
    return [];
  }
  return value.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.type !== "string" || typeof item.name !== "string") {
      errors.push(`entitySuggestions[${index}] is invalid`);
      return [];
    }
    try {
      return [{
        type: item.type.trim(), name: normalizeEntityName(item.name),
        alias: typeof item.alias === "string" ? normalizeEntityName(item.alias) : undefined,
        category: typeof item.category === "string" ? normalizeEntityName(item.category) : undefined
      }];
    } catch {
      errors.push(`entitySuggestions[${index}] is invalid`);
      return [];
    }
  });
}

function readActivities(value: unknown, errors: string[]): OracleResponse["activities"] {
  if (!Array.isArray(value)) {
    errors.push("activities must be an array");
    return [];
  }
  return value.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.scale !== "string" || !(item.scale in ACTIVITY_BASE_XP) || !Number.isSafeInteger(item.durationMinutes) || item.durationMinutes < 0 || !Array.isArray(item.classifications)) {
      errors.push(`activities[${index}] is invalid`);
      return [];
    }
    const classifications = item.classifications.flatMap((classification, classificationIndex) => {
      if (!isRecord(classification) || typeof classification.stat !== "string" || !STAT_KEYS.includes(classification.stat as StatKey) || !Number.isSafeInteger(classification.weight) || classification.weight <= 0) {
        errors.push(`activities[${index}].classifications[${classificationIndex}] is invalid`);
        return [];
      }
      return [{ stat: classification.stat as StatKey, weight: Number(classification.weight) }];
    });
    const uniqueStats = new Set(classifications.map((classification) => classification.stat));
    if (classifications.length === 0 || uniqueStats.size !== classifications.length || classifications.reduce((total, classification) => total + classification.weight, 0) !== 100) {
      errors.push(`activities[${index}] classifications must contain unique core statistics totaling 100`);
    }
    return [{ scale: item.scale as ActivityScale, durationMinutes: Number(item.durationMinutes), classifications }];
  });
}

function readStats(value: unknown, errors: string[]): Record<StatKey, number> {
  const result = {} as Record<StatKey, number>;
  if (!isRecord(value)) {
    errors.push("stats must be an object");
    return result;
  }
  for (const key of Object.keys(value)) {
    if (!STAT_KEYS.includes(key as StatKey)) errors.push(`stats.${key} cannot be assigned by the Oracle`);
  }
  for (const key of STAT_KEYS) {
    const amount = value[key];
    if (!Number.isSafeInteger(amount) || amount < 0) errors.push(`stats.${key} must be a non-negative integer`);
    else result[key] = Number(amount);
  }
  return result;
}

function readCharacters(value: unknown, errors: string[]): OracleResponse["newCharacters"] {
  if (!Array.isArray(value)) {
    errors.push("newCharacters must be an array");
    return [];
  }
  return value.flatMap((item, index) => {
    if (!isRecord(item)) {
      errors.push(`newCharacters[${index}] must be an object`);
      return [];
    }
    return [{ name: readText(item.name, `newCharacters[${index}].name`, errors), alias: readText(item.alias, `newCharacters[${index}].alias`, errors), role: readText(item.role, `newCharacters[${index}].role`, errors) }];
  });
}

function readKnowledge(value: unknown, errors: string[]): OracleResponse["newKnowledge"] {
  if (!Array.isArray(value)) {
    errors.push("newKnowledge must be an array");
    return [];
  }
  return value.flatMap((item, index) => {
    if (!isRecord(item)) {
      errors.push(`newKnowledge[${index}] must be an object`);
      return [];
    }
    return [{ name: readText(item.name, `newKnowledge[${index}].name`, errors), category: readText(item.category, `newKnowledge[${index}].category`, errors) }];
  });
}

function readBossDamage(value: unknown, errors: string[]): OracleResponse["bossDamage"] {
  if (!Array.isArray(value)) {
    errors.push("bossDamage must be an array");
    return [];
  }
  return value.flatMap((item, index) => {
    if (!isRecord(item) || !Number.isSafeInteger(item.amount) || item.amount < 0) {
      errors.push(`bossDamage[${index}] must have a non-negative integer amount`);
      return [];
    }
    return [{ boss_id: readText(item.boss_id, `bossDamage[${index}].boss_id`, errors), amount: Number(item.amount), source_stat: readText(item.source_stat, `bossDamage[${index}].source_stat`, errors) }];
  });
}

function readStringArray(value: unknown, field: string, errors: string[]): string[] {
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array`);
    return [];
  }
  return value.map((item, index) => readText(item, `${field}[${index}]`, errors));
}

function readText(value: unknown, field: string, errors: string[]): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${field} must be a non-empty string`);
    return "";
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(error: string): OracleValidation {
  return { ok: false, errors: [error] };
}
