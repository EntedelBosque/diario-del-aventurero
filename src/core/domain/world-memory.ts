export const INITIAL_ENTITY_TYPES = ["personaje", "lugar", "conocimiento", "herramienta", "objeto", "organizacion"] as const;

export type EntityType = (typeof INITIAL_ENTITY_TYPES)[number] | (string & {});

export type EntitySuggestion = {
  type: EntityType;
  name: string;
  alias?: string;
  category?: string;
};

export type WorldEntity = {
  id: string;
  type: EntityType;
  name: string;
  aliases: string[];
  discoveredAt: Date;
  mergedIntoEntityId?: string;
};

export function mergeEntities(canonical: WorldEntity, duplicate: WorldEntity): WorldEntity {
  if (canonical.id === duplicate.id) throw new Error("an entity cannot merge into itself");
  if (canonical.type !== duplicate.type) throw new Error("only entities of the same type can merge");

  const aliases = [...new Set([...canonical.aliases, canonical.name, ...duplicate.aliases, duplicate.name])]
    .filter((alias) => alias !== canonical.name);

  return { ...canonical, aliases };
}

export function normalizeEntityName(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) throw new Error("entity name is required");
  return normalized;
}
