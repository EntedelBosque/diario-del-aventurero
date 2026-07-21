# Diario de un Aventurero — Contexto del Proyecto

## Qué es
Sistema de rastreo de vida tipo RPG. El usuario (Fernando) escribe entradas de diario en lenguaje natural; una IA actúa como "Dungeon Master/Oráculo" y convierte esas entradas en narrativa RPG + actualizaciones de stats, personajes, conocimientos, misiones y bosses. No es un habit tracker — es un motor de videojuego personal / "universo vivo" que aprende continuamente sobre la vida del usuario (personas, lugares, herramientas, empresas, mascotas, libros).

Uso: solo personal (Fernando), enfocado con todo el contexto que ya se tiene de él.

## Roles acordados (división de trabajo entre IAs)
- **ChatGPT — Game Designer:** diseña el universo, mecánicas, economía, progresión, lore y reglas. Está escribiendo "The Living Codex" (el GDD/constitución del juego).
- **Claude — Arquitecto/Artesano:** implementa el código siguiendo las specs del Codex. (Este rol continúa en Claude Code.)
- **Gemini Flash — Oráculo en producción:** interpreta las entradas diarias del usuario y genera narrativa + JSON estructurado, corriendo dentro de la app ya construida. Elegido por su free tier generoso (~1,500 req/día, ~15 RPM) — decisión de costo, no de calidad. Activar billing igual para evitar que los prompts personales se usen para entrenar el modelo de Google.

## Por qué no Claude/OpenAI como oráculo en producción
- Claude API: sin free tier, pago por token (~$1-3/mes estimado para el volumen de uso de Fernando — bajo pero no cero). Fernando decidió no pagar por esto.
- OpenAI API: tampoco tiene free tier real; "ChatGPT gratis" solo sirve para uso manual (copiar/pegar), lo cual se quería evitar.
- Decisión final: Claude se usa gratis aquí en claude.ai/Claude Code para diseñar y construir; Gemini corre gratis en producción como oráculo.

## Principio de arquitectura no negociable
**Proveedor de IA intercambiable.** El agente oráculo debe llamarse a través de una función abstracta tipo `callAgent(prompt, context)` que internamente decida el proveedor (Gemini, OpenAI, Claude, etc.). Si Google cambia su free tier, solo se cambia el proveedor, no se rediseña la app.

## Arquitectura técnica (MVP, costo ~$0/mes)
```
iPhone (Safari) → PWA (Next.js + React + Tailwind)
      → API (Node.js/FastAPI)
      → Supabase (Postgres, plan gratuito) ← fuente de verdad del estado del juego
      → Agente IA (Gemini Flash vía Google AI Studio, free tier)
Hosting: Vercel (gratis para proyectos personales)
```

### Principios de diseño de datos
1. **El lore vive en la base de datos, nunca en el prompt.** El prompt solo carga los datos relevantes a la entrada actual (personajes mencionados, stats activos, misiones/bosses activos) — contexto mínimo, no el historial completo.
2. **La IA siempre responde JSON estructurado, nunca texto libre al backend:**
   ```json
   {
     "summary": "...",
     "stats": {},
     "newCharacters": [],
     "newKnowledge": [],
     "questsCompleted": [],
     "bossDamage": []
   }
   ```
   El frontend decide cómo renderizarlo.
3. **Memoria semántica, no solo texto:** guardar hechos/relaciones (José → Conoce → Playwright → Categoría → QA), no párrafos.
4. **Sistema de relaciones por personaje:** afinidad, confianza, tiempo compartido, aventuras juntos — afecta cómo narra la IA.

## Tablas de Supabase (borrador)
`players, stats, characters, locations, knowledge, quests, bosses, market, events, achievements, inventory` — más campos de afinidad/confianza para relaciones, e historial de balance de stats para el "Game Director" (ver abajo).

## Mecánicas del juego (definidas hasta ahora)
- **Misiones:** Comunes (24h), Raras (3 días), Épicas (15 días), Legendarias (60 días).
- **Bosses:** no pierden HP por hacer tareas en general — tienen debilidades temáticas específicas (ej. Disciplina, Tecnología, Arte) y solo esas categorías de actividad hacen daño.
- **Mercado:** moneda ganada (Oro, Cristales, Reliquias) canjeable por recompensas reales; eventos temporales (Festival del Reino, -50%).
- **Temporadas:** cada 3 meses, un tema que multiplica XP de cierta categoría (ej. Temporada del Escultor = arte x2).
- **Game Director (idea de ChatGPT, no implementada aún):** revisa el estado del mundo cada cierto tiempo; si una stat está desbalanceada (ej. Social muy baja), deja de generar misiones de las categorías altas y genera misiones que equilibren.

## The Living Codex — estructura (en progreso, lo escribe ChatGPT)
Volumen I: Filosofía · II: El Jugador · III: El Mundo · IV: Sistema RPG · V: El Oráculo · VI: Arquitectura · VII: Balance · VIII: Interfaz

### 5 principios inquebrantables (borrador)
1. La vida real siempre tiene prioridad; el juego se adapta, nunca castiga por vivir.
2. El progreso es significativo — las stats reflejan crecimiento real, no números inflados.
3. La memoria pertenece al jugador — todo vive en la base de datos, la IA solo interpreta.
4. La narrativa sirve al progreso — inspira, pero nunca sustituye los hechos registrados.
5. El juego evoluciona contigo — nuevas mecánicas se incorporan sin romper el sistema.

## Decisión de metodología
Fernando quiere que la v1 sea sólida desde el inicio, no un prototipo desechable. Acuerdo alcanzado: el "prototipo funcional" usa desde el día 1 el mismo modelo de datos/schema que luego migra 1:1 a Supabase — no es trabajo desechable, es Fase 1 y 2 en paralelo sin backend propio todavía. Se valida el loop del juego con datos reales de Fernando antes de invertir en infraestructura completa.

## Estado actual / próximos pasos
1. Completar el Codex con ChatGPT (empezando por Volumen I: Filosofía + los 5 principios).
2. Traer el Codex a Claude Code → convertir en schema de datos formal.
3. Construir el MVP: PWA + API + Supabase + integración con Gemini Flash como oráculo (función intercambiable de proveedor).
4. Validar el loop 2-3 semanas con uso real.
5. Iterar según lo que muestre el uso real.

## Preferencias de Fernando relevantes para el desarrollo
- Prefiere HTML/interfaces interactivas con estética barroca/dark academia, paleta otoñal.
- Es QA/IT profesionalmente — valora rigor, evitar over-engineering prematuro, pero también evitar deuda técnica por prisa.
- Es escultor 3D (ZBrush) bajo la marca "Ente del Bosque" — contexto de fondo, no directamente relevante al código pero parte de su identidad creativa.
