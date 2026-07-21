---
name: diario-aventurero-dev
description: >
  Desarrollo del proyecto "Diario de un Aventurero" (life-RPG tracker personal
  de Fernando). Úsala SIEMPRE que se trabaje en el código, schema de datos,
  prompt del Oráculo, o arquitectura de esta app — aunque no se mencione el
  nombre del proyecto explícitamente, si se habla de Supabase + Gemini/Claude
  como agente narrador, Codex, personajes/stats/bosses/misiones de un RPG de
  vida, esta skill aplica.
---

# Diario de un Aventurero — Skill de desarrollo

Contexto persistente para construir el motor de este RPG de vida personal.
Complementa (no reemplaza) `ios-safari-webapp` para los detalles de PWA/Safari.

## 1. Arquitectura fija (no renegociable sin avisar a Fernando)

```
PWA (Next.js + React + Tailwind)
  → API routes (Next.js) o backend ligero
  → Supabase (Postgres) — fuente de verdad del estado del juego
  → callAgent(prompt, context) — capa intercambiable de proveedor IA
       ├─ Gemini Flash (producción, free tier)
       ├─ Claude (desarrollo/diseño, opcional producción de pago)
       └─ OpenAI (opcional)
Hosting: Vercel
```

**Regla de oro:** el lore, las reglas y el estado del juego viven en Supabase,
nunca hardcodeados en el prompt. El prompt solo recibe el contexto mínimo
relevante a la entrada actual (personajes mencionados, stats activos,
misiones/bosses activos) — nunca el historial completo.

## 2. Contrato de salida del Oráculo (JSON, siempre)

El agente IA nunca devuelve texto libre al backend. Siempre este shape
(ajustar campos según evolucione el Codex, pero mantener la estructura):

```json
{
  "summary": "string - resumen narrativo corto",
  "narrative": "string - la crónica completa en tono RPG",
  "stats": { "arte": 0, "tecnologia": 0, "social": 0, "disciplina": 0 },
  "newCharacters": [{ "name": "", "alias": "", "role": "" }],
  "newKnowledge": [{ "name": "", "category": "" }],
  "questsCompleted": ["quest_id"],
  "bossDamage": [{ "boss_id": "", "amount": 0, "source_stat": "" }]
}
```

El frontend decide el render; el backend valida el JSON antes de escribir a
Supabase (nunca confiar ciegamente en la salida del modelo).

## 3. Tablas base de Supabase (ampliar, no reescribir)

`players, stats, characters, locations, knowledge, quests, bosses, market,
events, achievements, inventory` — más:
- `relationships` (character_id, afinidad, confianza, horas_compartidas, aventuras)
- `stat_history` (para que el futuro "Game Director" detecte desbalances)

## 4. Patrón de proveedor intercambiable

Nunca llamar a un SDK de proveedor directamente desde la lógica de negocio.
Siempre a través de una función abstracta, ej.:

```ts
async function callAgent(prompt: string, context: object): Promise<OracleResponse> {
  const provider = process.env.AI_PROVIDER; // "gemini" | "claude" | "openai"
  // switch/dispatch aquí, cada adapter devuelve el mismo shape validado
}
```

Esto permite cambiar de Gemini a Claude sin tocar el resto de la app.

## 5. Checklist antes de escribir código

1. ¿El cambio respeta que el lore vive en la DB, no en el prompt?
2. ¿La salida del oráculo sigue el contrato JSON?
3. ¿El proveedor de IA sigue siendo intercambiable (no hay llamada directa a un SDK específico fuera del adapter)?
4. ¿Las keys (Supabase, Gemini, etc.) están en `.env.local`, nunca commiteadas?
5. Si toca UI: revisar `ios-safari-webapp` skill para quirks de Safari iOS (100dvh, safe-area, zoom en inputs).

## 6. Fuente de verdad del diseño del juego

El Codex (Volúmenes I-VIII, escrito con ChatGPT) manda sobre cualquier
decisión de código. Si el código y el Codex no coinciden, se avisa a
Fernando — no se improvisa una regla nueva del juego desde el código.
