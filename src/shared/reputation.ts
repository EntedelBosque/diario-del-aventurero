// Reputación/afinidad con una entidad, según cuántas veces ha aparecido en tus relatos.
// Escala épica pero sobria. Sirve para personas, lugares y Reinos.
const RANKS: Array<{ min: number; label: string }> = [
  { min: 20, label: "Leyenda" },
  { min: 12, label: "Vínculo forjado" },
  { min: 7, label: "Aliado" },
  { min: 4, label: "Conocido" },
  { min: 2, label: "Presencia" },
  { min: 0, label: "Recién hallado" }
];

export function reputationRank(mentions: number): string {
  return (RANKS.find((rank) => mentions >= rank.min) ?? RANKS[RANKS.length - 1]).label;
}
