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
  { code: "forja_acero", officialName: "La Forja del Acero", primaryStat: "tecnologia" },
  { code: "atelier_bosque", officialName: "El Atelier del Bosque", primaryStat: "arte" },
  { code: "orden_roble", officialName: "La Orden del Roble", primaryStat: "vitalidad" },
  { code: "caminantes_horizonte", officialName: "Los Caminantes del Horizonte", primaryStat: "sabiduria" },
  { code: "archivo_eterno", officialName: "El Archivo Eterno", primaryStat: "sabiduria" },
  { code: "vinculos_reino", officialName: "Los Vinculos del Reino", primaryStat: "social" }
];
