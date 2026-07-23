// Pertenencia y niveles de gremio por afinidad (maestría):
//  < 50  -> aún no perteneces (no aparece en tus estadísticas del Diario).
//  50    -> te unes (nivel base).
//  +100  -> cada escalón sube de material: 150 Madera, 250 Piedra, 350 Bronce, ...
export const GUILD_JOIN_THRESHOLD = 50;

const MATERIALS = ["", "Madera", "Piedra", "Bronce", "Hierro", "Acero", "Plata", "Oro", "Platino", "Diamante", "Mítico"];

export type GuildTier = { joined: boolean; tierIndex: number; tierName: string | null; nextAt: number };

export function guildTier(mastery: number): GuildTier {
  const joined = mastery >= GUILD_JOIN_THRESHOLD;
  const tierIndex = mastery < 150 ? 0 : Math.min(MATERIALS.length - 1, Math.floor((mastery - 50) / 100));
  const nextAt = mastery < GUILD_JOIN_THRESHOLD ? GUILD_JOIN_THRESHOLD : (Math.floor((mastery - 50) / 100) + 1) * 100 + 50;
  return { joined, tierIndex, tierName: MATERIALS[tierIndex] || null, nextAt };
}
