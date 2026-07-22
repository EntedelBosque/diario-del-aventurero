// Nombres oficiales de los gremios (fuente: migración 202607210011_guilds.sql).
// El API devuelve el código (slug); la UI muestra el nombre.
const GUILD_NAMES: Record<string, string> = {
  forja_acero: "La Forja del Acero",
  atelier_bosque: "El Atelier del Bosque",
  orden_roble: "La Orden del Roble",
  vinculos_reino: "Los Vínculos del Reino",
  archivo_eterno: "El Archivo Eterno",
  caminantes_horizonte: "Los Caminantes del Horizonte"
};

export function guildName(code: string): string {
  return GUILD_NAMES[code] ?? code;
}
