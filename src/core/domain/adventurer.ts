export const CORE_STAT_KEYS = ["arte", "tecnologia", "vitalidad", "social", "sabiduria"] as const;
export const DERIVED_STAT_KEYS = ["disciplina"] as const;

export type CoreStatKey = (typeof CORE_STAT_KEYS)[number];
export type DerivedStatKey = (typeof DERIVED_STAT_KEYS)[number];
export type PlayerState = "activo" | "descansando" | "vacaciones" | "recuperacion" | "lesionado" | "enfermo";

export const INITIAL_ADVENTURER = {
  name: "Fernando",
  title: "El Aventurero",
  characterClass: "Aventurero",
  level: 1,
  experience: 0,
  state: "activo" as const
};

export const INITIAL_DERIVED_STATS: Readonly<Record<DerivedStatKey, number>> = {
  disciplina: 50
};

export type GuildDefinition = {
  code: string;
  officialName: string;
  primaryStat: CoreStatKey;
};

// These identifiers mirror seed data in Supabase; gameplay configuration is data, not prompt text.
export const INITIAL_GUILDS: readonly GuildDefinition[] = [
  { code: "arte", officialName: "El Taller de los Escultores Eternos", primaryStat: "arte" },
  { code: "tecnologia", officialName: "La Forja del Acero del Futuro", primaryStat: "tecnologia" },
  { code: "vitalidad", officialName: "La Orden del Cuerpo Indomable", primaryStat: "vitalidad" },
  { code: "social", officialName: "La Hermandad de los Caminantes", primaryStat: "social" },
  { code: "sabiduria", officialName: "El Archivo de los Sabios Eternos", primaryStat: "sabiduria" }
];
