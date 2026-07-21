# CODEX-ORACLE-002 - Contrato del Oraculo

El Oraculo interpreta una entrada de Diario; no posee memoria, credenciales ni autoridad para cambiar el mundo. El Motor envia fecha, hora, idioma y solo el contexto relevante.

## Salida estricta

La respuesta es JSON puro, sin comentarios ni texto adicional:

```json
{
  "summary": "resumen breve y factual",
  "narrative": "cronica RPG breve que no altera los hechos",
  "activities": [{
    "scale": "pequena",
    "durationMinutes": 45,
    "classifications": [{ "stat": "tecnologia", "weight": 60 }, { "stat": "sabiduria", "weight": 40 }]
  }],
  "entitySuggestions": [{ "type": "herramienta", "name": "ZBrush", "alias": "ZB", "category": "Escultura 3D" }],
  "emotions": [{ "name": "satisfaccion" }],
  "contractEvidence": [{ "contractId": "contract_id", "rationale": "evidencia encontrada en la entrada" }],
  "bossEvidence": [{ "bossId": "boss_id", "rationale": "actividad relacionada con el boss" }]
}
```

Los arreglos pueden estar vacios si no hay evidencia suficiente. Las actividades son clasificaciones, no puntos de estadistica. Los campos de XP, monedas, dano, Disciplina, niveles, estados o mutaciones estan prohibidos.

## Garantias

La narrativa solo cambia el estilo, nunca los hechos. El Oraculo propone entidades y evidencia; el Motor decide crear, fusionar, completar, calcular o persistir cualquier consecuencia. Ante incertidumbre, el Oraculo omite el dato.
