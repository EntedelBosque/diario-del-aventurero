export type GlossaryEntry = { emoji: string; title: string; body: string; howToEarn: string };

// Diccionario del reino: significado de estadísticas y gremios, y cómo se ganan.
// Fuente: CONTEXT.md + migración 202607210011_guilds.sql.
export const GLOSSARY: Record<string, GlossaryEntry> = {
  // Estadísticas
  arte: { emoji: "🎨", title: "Arte", body: "Tu creatividad y expresión: escultura, modelado, diseño, fotografía y museos.", howToEarn: "Registra actividades de categoría «arte» en tu diario." },
  tecnologia: { emoji: "⚙️", title: "Tecnología", body: "Tu ingenio técnico: QA, programación, automatización e ingeniería.", howToEarn: "Registra actividades de categoría «tecnología»." },
  vitalidad: { emoji: "🌿", title: "Vitalidad", body: "Tu cuerpo y bienestar: salud, entrenamiento, nutrición y descanso.", howToEarn: "Registra actividades de categoría «vitalidad»." },
  social: { emoji: "🤝", title: "Social", body: "Tus vínculos: familia, amistades, relaciones y comunidad.", howToEarn: "Registra actividades de categoría «social» (conversaciones, tiempo con gente)." },
  sabiduria: { emoji: "📚", title: "Sabiduría", body: "Tu conocimiento: lectura, investigación y aprendizaje.", howToEarn: "Registra actividades de categoría «sabiduría»." },
  disciplina: { emoji: "🔥", title: "Disciplina", body: "Tu constancia. Es una estadística derivada (0–100): sube con regularidad y contratos completados, baja con la inactividad.", howToEarn: "Escribe con regularidad y completa misiones; la inactividad la reduce." },

  // Gremios
  forja_acero: { emoji: "⚔️", title: "La Forja del Acero", body: "El gremio de QA, tecnología, programación y automatización.", howToEarn: "Gana maestría con actividades técnicas." },
  atelier_bosque: { emoji: "🎨", title: "El Atelier del Bosque", body: "El gremio de escultura, arte, modelado, diseño, fotografía y museos.", howToEarn: "Gana maestría con actividades de arte." },
  orden_roble: { emoji: "🌳", title: "La Orden del Roble", body: "El gremio de la salud, el entrenamiento, la nutrición, el descanso y el bienestar.", howToEarn: "Gana maestría cuidando tu cuerpo: ejercicio, descanso, buena alimentación." },
  vinculos_reino: { emoji: "🤝", title: "Los Vínculos del Reino", body: "El gremio de la familia, las amistades, las relaciones y la comunidad.", howToEarn: "Gana maestría con actividades sociales." },
  archivo_eterno: { emoji: "📜", title: "El Archivo Eterno", body: "El gremio de la lectura, la investigación, el aprendizaje y el conocimiento.", howToEarn: "Gana maestría estudiando e investigando." },
  caminantes_horizonte: { emoji: "🧭", title: "Los Caminantes del Horizonte", body: "El gremio de los viajes, la exploración, la cultura y los idiomas.", howToEarn: "Gana maestría viajando, explorando y aprendiendo culturas." }
};

export function glossaryEntry(key: string): GlossaryEntry | undefined {
  return GLOSSARY[key];
}
