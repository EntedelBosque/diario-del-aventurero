# CODEX-ORACLE-001 - Contrato del Oraculo

El Oraculo interpreta hechos; no posee memoria ni autoridad para modificar el mundo.

## Entrada minima

El adaptador recibe la entrada original y una vista de contexto relevante: estadisticas activas, entidades relacionadas, contratos activos y bosses activos. No recibe el historial completo.

## Salida estricta

El proveedor debe devolver JSON validable con esta forma:

```json
{
  "summary": "resumen narrativo corto",
  "narrative": "cronica RPG",
  "stats": { "arte": 0, "tecnologia": 0, "vitalidad": 0, "social": 0, "sabiduria": 0 },
  "newCharacters": [{ "name": "", "alias": "", "role": "" }],
  "newKnowledge": [{ "name": "", "category": "" }],
  "contractEvidence": [{ "contractId": "contract_id", "rationale": "evidencia encontrada en la entrada" }],
  "bossDamage": [{ "bossId": "boss_id", "amount": 0, "sourceStat": "tecnologia" }],
  "activities": [{
    "scale": "pequena",
    "durationMinutes": 45,
    "classifications": [{ "stat": "tecnologia", "weight": 60 }, { "stat": "sabiduria", "weight": 40 }]
  }],
  "entitySuggestions": [{ "type": "herramienta", "name": "ZBrush", "alias": "ZB", "category": "Escultura 3D" }]
}
```

`contractEvidence` puede estar vacio y solo señala posibles pruebas: nunca completa, falla ni expira un contrato. `activities` puede estar vacio si la entrada no describe una actividad valida. Cada actividad usa una escala, duracion y clasificaciones unicas que suman 100. `entitySuggestions` puede estar vacio; es una propuesta, nunca una creacion directa. Los valores son propuestas interpretativas, no instrucciones. `disciplina` no puede formar parte de esta respuesta: es una estadistica derivada, visible y calculada diariamente por el Motor a partir del historial. El backend valida el JSON y el motor decide en una fase posterior cuales pueden convertirse en eventos del juego conforme a reglas escritas del Codex.

## Fallos

Una respuesta invalida, incompleta o no disponible se guarda como resultado rechazado o fallido. El hecho original no se pierde, no se inventa una mutacion y el reintento usa la misma clave de idempotencia.
