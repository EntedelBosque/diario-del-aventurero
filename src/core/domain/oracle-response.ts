import { ACTIVITY_BASE_XP, type ActivityScale } from "./progression.ts";
import { normalizeEntityName, type EntitySuggestion } from "./world-memory.ts";
import { CORE_STAT_KEYS, type CoreStatKey } from "./adventurer.ts";

export type OracleActivity = { category: string; scale: ActivityScale; durationMinutes: number; classifications: Array<{ stat: CoreStatKey; weight: number }> };
export type OracleResponse = {
  summary: string;
  narrative: string;
  activities: OracleActivity[];
  entitySuggestions: EntitySuggestion[];
  emotions: Array<{ name: string }>;
  contractEvidence: Array<{ contractId: string; rationale: string }>;
  bossEvidence: Array<{ bossId: string; rationale: string }>;
};
export type OracleValidation = { ok: true; value: OracleResponse } | { ok: false; errors: string[] };
const RESPONSE_FIELDS = new Set(["summary", "narrative", "activities", "entitySuggestions", "emotions", "contractEvidence", "bossEvidence"]);

export function validateOracleResponse(value: unknown): OracleValidation {
  if (!isRecord(value)) return { ok: false, errors: ["The response must be an object"] };
  const errors: string[] = [];
  for (const field of Object.keys(value)) if (!RESPONSE_FIELDS.has(field)) errors.push(`${field} is not permitted in an Oracle response`);
  const summary = readText(value.summary, "summary", errors);
  const narrative = readText(value.narrative, "narrative", errors);
  const activities = readActivities(value.activities, errors);
  const entitySuggestions = readEntitySuggestions(value.entitySuggestions, errors);
  const emotions = readEmotions(value.emotions, errors);
  const contractEvidence = readEvidence(value.contractEvidence, "contractEvidence", "contractId", errors) as OracleResponse["contractEvidence"];
  const bossEvidence = readEvidence(value.bossEvidence, "bossEvidence", "bossId", errors) as OracleResponse["bossEvidence"];
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: { summary, narrative, activities, entitySuggestions, emotions, contractEvidence, bossEvidence } };
}

function readActivities(value: unknown, errors: string[]): OracleActivity[] {
  if (!Array.isArray(value)) { errors.push("activities must be an array"); return []; }
  return value.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.category !== "string" || item.category.trim().length === 0 || typeof item.scale !== "string" || !(item.scale in ACTIVITY_BASE_XP) || !Number.isSafeInteger(item.durationMinutes) || item.durationMinutes < 0 || !Array.isArray(item.classifications)) { errors.push(`activities[${index}] is invalid`); return []; }
    const classifications = item.classifications.flatMap((classification, classificationIndex) => {
      if (!isRecord(classification) || typeof classification.stat !== "string" || !CORE_STAT_KEYS.includes(classification.stat as CoreStatKey) || !Number.isSafeInteger(classification.weight) || classification.weight <= 0) { errors.push(`activities[${index}].classifications[${classificationIndex}] is invalid`); return []; }
      return [{ stat: classification.stat as CoreStatKey, weight: Number(classification.weight) }];
    });
    const uniqueStats = new Set(classifications.map((classification) => classification.stat));
    if (classifications.length === 0 || uniqueStats.size !== classifications.length || classifications.reduce((total, classification) => total + classification.weight, 0) !== 100) errors.push(`activities[${index}] classifications must contain unique core statistics totaling 100`);
    return [{ category: item.category.trim(), scale: item.scale as ActivityScale, durationMinutes: Number(item.durationMinutes), classifications }];
  });
}

function readEntitySuggestions(value: unknown, errors: string[]): EntitySuggestion[] {
  if (!Array.isArray(value)) { errors.push("entitySuggestions must be an array"); return []; }
  return value.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.type !== "string" || typeof item.name !== "string") { errors.push(`entitySuggestions[${index}] is invalid`); return []; }
    try { return [{ type: item.type.trim(), name: normalizeEntityName(item.name), alias: typeof item.alias === "string" ? normalizeEntityName(item.alias) : undefined, category: typeof item.category === "string" ? normalizeEntityName(item.category) : undefined }]; }
    catch { errors.push(`entitySuggestions[${index}] is invalid`); return []; }
  });
}

function readEmotions(value: unknown, errors: string[]): OracleResponse["emotions"] {
  if (!Array.isArray(value)) { errors.push("emotions must be an array"); return []; }
  return value.map((item, index) => ({ name: readText(isRecord(item) ? item.name : undefined, `emotions[${index}].name`, errors) }));
}

function readEvidence(value: unknown, field: "contractEvidence" | "bossEvidence", idField: "contractId" | "bossId", errors: string[]): Array<{ contractId: string; rationale: string }> | Array<{ bossId: string; rationale: string }> {
  if (!Array.isArray(value)) { errors.push(`${field} must be an array`); return []; }
  return value.flatMap((item, index) => {
    if (!isRecord(item)) { errors.push(`${field}[${index}] must be an object`); return []; }
    const rationale = readText(item.rationale, `${field}[${index}].rationale`, errors);
    const id = readText(item[idField], `${field}[${index}].${idField}`, errors);
    return idField === "contractId" ? [{ contractId: id, rationale }] : [{ bossId: id, rationale }];
  });
}

function readText(value: unknown, field: string, errors: string[]): string {
  if (typeof value !== "string" || value.trim().length === 0) { errors.push(`${field} must be a non-empty string`); return ""; }
  return value.trim();
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
