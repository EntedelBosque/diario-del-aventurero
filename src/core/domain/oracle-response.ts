import { ACTIVITY_BASE_XP, type ActivityScale } from "./progression.ts";
import { normalizeEntityName, type EntitySuggestion } from "./world-memory.ts";
import { CORE_STAT_KEYS, type CoreStatKey } from "./adventurer.ts";

export type OracleActivity = { category: string; scale: ActivityScale; durationMinutes: number; classifications: Array<{ stat: CoreStatKey; weight: number }> };
export type OracleResponse = {
  title?: string;
  summary: string;
  narrative: string;
  activities: OracleActivity[];
  entitySuggestions: EntitySuggestion[];
  emotions: Array<{ name: string }>;
  contractEvidence: Array<{ contractId: string; rationale: string }>;
  bossEvidence: Array<{ bossId: string; rationale: string }>;
};
export type OracleValidation = { ok: true; value: OracleResponse } | { ok: false; errors: string[] };
const RESPONSE_FIELDS = new Set(["title", "summary", "narrative", "activities", "entitySuggestions", "emotions", "contractEvidence", "bossEvidence"]);

export function validateOracleResponse(value: unknown): OracleValidation {
  if (!isRecord(value)) return { ok: false, errors: ["The response must be an object"] };
  const errors: string[] = [];
  for (const field of Object.keys(value)) if (!RESPONSE_FIELDS.has(field)) errors.push(`${field} is not permitted in an Oracle response`);
  const title = typeof value.title === "string" && value.title.trim().length > 0 ? value.title.trim() : undefined;
  const summary = readText(value.summary, "summary", errors);
  const narrative = readText(value.narrative, "narrative", errors);
  const activities = readActivities(value.activities, errors);
  const entitySuggestions = readEntitySuggestions(value.entitySuggestions, errors);
  const emotions = readEmotions(value.emotions, errors);
  const contractEvidence = readEvidence(value.contractEvidence, "contractEvidence", "contractId", errors) as OracleResponse["contractEvidence"];
  const bossEvidence = readEvidence(value.bossEvidence, "bossEvidence", "bossId", errors) as OracleResponse["bossEvidence"];
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: { title, summary, narrative, activities, entitySuggestions, emotions, contractEvidence, bossEvidence } };
}

function readActivities(value: unknown, errors: string[]): OracleActivity[] {
  if (!Array.isArray(value)) { errors.push("activities must be an array"); return []; }
  return value.flatMap((item, index) => {
    if (!isRecord(item)) { errors.push(`activities[${index}] is invalid`); return []; }
    const { category, scale, durationMinutes, classifications: rawClassifications } = item;
    if (typeof category !== "string" || category.trim().length === 0 || typeof scale !== "string" || !(scale in ACTIVITY_BASE_XP) || !Number.isSafeInteger(durationMinutes) || !Array.isArray(rawClassifications)) { errors.push(`activities[${index}] is invalid`); return []; }
    const safeDurationMinutes = Number(durationMinutes);
    if (safeDurationMinutes < 0) { errors.push(`activities[${index}] is invalid`); return []; }
    const classifications = rawClassifications.flatMap((classification, classificationIndex) => {
      if (!isRecord(classification)) { errors.push(`activities[${index}].classifications[${classificationIndex}] is invalid`); return []; }
      const { stat, weight } = classification;
      if (typeof stat !== "string" || !CORE_STAT_KEYS.includes(stat as CoreStatKey) || !Number.isSafeInteger(weight)) { errors.push(`activities[${index}].classifications[${classificationIndex}] is invalid`); return []; }
      const safeWeight = Number(weight);
      if (safeWeight <= 0) { errors.push(`activities[${index}].classifications[${classificationIndex}] is invalid`); return []; }
      return [{ stat: stat as CoreStatKey, weight: safeWeight }];
    });
    const uniqueStats = new Set(classifications.map((classification) => classification.stat));
    if (classifications.length === 0 || uniqueStats.size !== classifications.length || classifications.reduce((total, classification) => total + classification.weight, 0) !== 100) errors.push(`activities[${index}] classifications must contain unique core statistics totaling 100`);
    return [{ category: category.trim(), scale: scale as ActivityScale, durationMinutes: safeDurationMinutes, classifications }];
  });
}

function readEntitySuggestions(value: unknown, errors: string[]): EntitySuggestion[] {
  if (!Array.isArray(value)) { errors.push("entitySuggestions must be an array"); return []; }
  return value.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.type !== "string" || typeof item.name !== "string") { errors.push(`entitySuggestions[${index}] is invalid`); return []; }
    try { return [{ type: item.type.trim(), name: normalizeEntityName(item.name), alias: typeof item.alias === "string" ? normalizeEntityName(item.alias) : undefined, category: typeof item.category === "string" ? normalizeEntityName(item.category) : undefined, ...(typeof item.description === "string" && item.description.trim().length > 0 ? { description: item.description.trim().slice(0, 250) } : {}) }]; }
    catch { errors.push(`entitySuggestions[${index}] is invalid`); return []; }
  });
}

function readEmotions(value: unknown, errors: string[]): OracleResponse["emotions"] {
  if (!Array.isArray(value)) { errors.push("emotions must be an array"); return []; }
  return value.map((item, index) => ({ name: readText(isRecord(item) ? item.name : undefined, `emotions[${index}].name`, errors) }));
}

function readEvidence(value: unknown, field: "contractEvidence" | "bossEvidence", idField: "contractId" | "bossId", errors: string[]): Array<{ contractId?: string; bossId?: string; rationale: string }> {
  if (!Array.isArray(value)) { errors.push(`${field} must be an array`); return []; }
  const evidence: Array<{ contractId?: string; bossId?: string; rationale: string }> = [];
  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) { errors.push(`${field}[${index}] must be an object`); continue; }
    const rationale = readText(item.rationale, `${field}[${index}].rationale`, errors);
    const id = readText(item[idField], `${field}[${index}].${idField}`, errors);
    if (idField === "contractId") evidence.push({ contractId: id, rationale });
    else evidence.push({ bossId: id, rationale });
  }
  return evidence;
}

function readText(value: unknown, field: string, errors: string[]): string {
  if (typeof value !== "string" || value.trim().length === 0) { errors.push(`${field} must be a non-empty string`); return ""; }
  return value.trim();
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
