// DEV-SPEC-019 — rangos interpretativos de Disciplina (solo descriptivos, no cambian mecánicas).
// Fase 1: +1 por crónica (máx 100), sin decaimiento. El decay diario llega con el Motor de Tiempo.
export function disciplineRank(value: number): string {
  if (value >= 90) return "Disciplina Legendaria";
  if (value >= 75) return "Disciplina Ejemplar";
  if (value >= 60) return "Disciplina Constante";
  if (value >= 40) return "Disciplina Variable";
  if (value >= 20) return "Disciplina Inestable";
  return "Disciplina Descuidada";
}
