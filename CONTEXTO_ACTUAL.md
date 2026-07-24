# Contexto Actual — Diario de un Aventurero
> Primer compacto para retomar el proyecto. Léelo antes que nada.
> Última actualización: 2026-07-22 · Versión: 0.15.0

## Stack y conexiones (para cualquier agente/IA que retome)
- **App:** Next.js 15 (App Router) + React 19, TypeScript, PWA. Hosting en **Vercel** (deploy auto en push a `main`).
- **Datos:** **Supabase** (Postgres) = fuente de verdad. Cliente navegador con `@supabase/ssr` (anon key);
  servidor con service-role (`src/adapters/persistence/supabase-server.ts`). Migraciones en `supabase/migrations/`.
- **IA (Oráculo):** proveedor intercambiable; por defecto **Groq**, alternativa Gemini (`src/adapters/oracle/`).
- **Secretos:** NO están en el repo (`.env`/`.env.local` en `.gitignore`). Viven en Vercel env + tu `.env.local`
  local: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, la API key del proveedor IA.
- **Nota para Codex/otras IAs:** cualquier agente con el repo sabrá que usamos Supabase y cómo se conecta
  (código + migraciones + estos docs). Lo único que NO tendrá son las llaves; hay que dárselas por env. La skill
  `diario-del-aventurero` es de Claude Code, pero los archivos que mantiene (este + BITACORA.md) son texto portable.

## En una línea
RPG personal persistente: Fernando escribe entradas de diario en lenguaje natural, un
Oráculo IA las convierte en narrativa + JSON estructurado, y un Motor determinista aplica
progresión (XP, gremios, contratos, bosses, economía) sobre Supabase como fuente de verdad.

## Qué funciona hoy
- **Núcleo del juego** independiente de framework (Next no toca reglas): progresión, gremios,
  contratos, bosses, economía, director del juego, memoria del mundo — con tests unitarios.
- **Motor de efectos persistido** en Supabase vía RPC `persist_motor_effects`, con lock
  optimista en todas las tablas mutables e idempotencia por `world_event_id` (migraciones 022–025).
- **Oráculo en producción** con proveedor intercambiable; por defecto **Groq**, con Gemini como
  alternativa, compartiendo el mismo contrato de prompt JSON.
- **Pantalla de diario (PWA)** rediseñada: estética pergamino/dark-academia, sello de envío con
  ícono de pluma (Quill), tarjeta de página con timestamp de aventurero (día/fecha/hora +
  marcador de solsticio/equinoccio), título evocador por página y recompensas (XP + gremios).
- **Sesión**: login redirige al diario si ya hay sesión, botón de cerrar sesión.
- Soporte de **múltiples actividades por evento** (migración 025 + contrato del Oráculo).

## En curso
- Iterar el diseño por la línea de "códice iluminado" + más RPG (grano, marco, tomos).
- 5 pestañas ya funcionales (Diario, Relatos, Mundo, Misiones, Mercado).

## Roadmap por fases (acordado 2026-07-22)
Orden recomendado: **F1 ✅ El Mundo vivo** → **F2 (siguiente) Libro épico** → F3 Generadores → F4 Economía/combate → F5 Robustez.
- **F1 COMPLETA ✅:** ficha de entidad (popover), descripción evolutiva ≤250, alias épico, reputación/
  afinidad por entidad (menciones → rango: Recién hallado→Presencia→Conocido→Aliado→Vínculo forjado→Leyenda),
  gremios con unión (50) y niveles de material (+100), afinidad de gremios en Mundo, tono épico global.
- **F-Living World (DEV-SPEC-013, en curso):** ver `CODEX/DEV-SPEC-013-living-world.md`. Hecho: memoria
  viva, alias/semblanza evolutivos, afinidad, Oráculo respeta la verdad actual, títulos legendarios.
  Pendiente: Reino activo vs Archivo Histórico (Eras), Archivo de Honores de títulos, evolución de
  relaciones con etapas, propuestas del Director para cambiar Reino activo.
- **F2 (después, cuando toque UI):** rediseño "librería" de Relatos. (Pie de ganancias y tono épico ya hechos.)

## Bugs arreglados (23 jul)
- Disciplina ahora sube +1 por entrada (decay por inactividad = futuro, requiere job programado).
- Los stats se refrescan al enviar (StatsPanel con refreshKey), sin salir/entrar.

## Preguntas de Fernando (respuestas para el roadmap)
- **Logros compartibles a Instagram:** factible a futuro (hay tablas achievements/player_achievements);
  compartir = generar imagen + Web Share API. Fase futura.
- **Notificaciones tipo Duolingo:** factible con PWA push (service worker + Web Push + VAPID + un job
  programado que envíe el recordatorio). Gratis pero es una fase dedicada. Requiere permiso del usuario.
- **F2:** tono más épico (prompt), pie de página por página con lo ganado (stats/objetos/misión/boss), rediseño "librería".
- **F3:** generadores de contratos (Director del Juego) y artículos de Mercado (contenido de Codex).
- **F4:** canjear monedas; bosses/misiones con daño. **F5:** tests, paginación, verificar backups.
- Feasibilidad confirmada a Fernando: descripción evolutiva de personajes ✔, reputación por Reino ✔, alias épicos ✔.
- Nota: Claude Pro NO mejora el PWA (solo la experiencia de desarrollo con Claude Code).

## Brechas conocidas (de la auditoría 2026-07-22)
1. **Economía desconectada** — `RunMotor` no emite `currencyDelta`; las monedas nunca se acreditan
   (Mercado siempre 0). Cablear economía es lo #1 para que Mercado tenga sentido.
2. **Sin generadores** — nada crea contratos (Misiones) ni bosses ni artículos de mercado. Requiere
   cablear el Director del Juego + definición de contenido por Codex.
3. **Backups** — hacer `pg_dump`/export periódico (free tier no da PITR).
4. **Deuda menor** — falta `.gitattributes` (CRLF), tests de endpoints nuevos, paginación futura.

## Sostenibilidad
Con 3 entradas/día: ~10–20 MB/año → **décadas** dentro de los 500 MB del free tier; IA **$0**
(90 req/mes). Riesgo real = operativo (pausa por inactividad de 7 días, backups), no capacidad.

## Qué funciona hoy (añadidos recientes)
- **Diario** muestra las **estadísticas** del Aventurero (nivel, XP, stats, maestría de gremios) vía `GET /api/player`.
- **Relatos** (`/relatos`): biblioteca por árbol Edad (año) → Época (mes) → páginas.
- Nav = **5 pestañas** (Diario, Relatos, Mundo, Misiones, Mercado). Se eliminó Personaje (su hoja está en Diario).
- Look RPG: grano de pergamino, marco interior en la page-card, tomos de biblioteca.
- Previews de diseño vía Artifacts HTML autónomos (método preferido por Fernando).

## Aprendizajes / gotchas
- **Categorías del Oráculo:** `activity.category` DEBE pertenecer al vocabulario cerrado de
  `guild_categories` (9 slugs en minúsculas), o el Motor no encuentra gremio. El prompt ya lo
  restringe. Si se agregan gremios/categorías, actualizar el enum del prompt Y la tabla.

## Próximos pasos
1. Probar el flujo completo desde el iPhone y revisar cómo se ve la página de resultado.
2. Diseñar los íconos propios de las otras 4 pestañas (Personaje, Mundo, Misiones, Mercado);
   hoy son solo texto.
3. Iterar la estética de la página de resultado con el feedback del dispositivo real.

## Pendientes manuales (fuera del repo)
- Migración `202607220025_activity_progress_records_multi_activity` — **ya aplicada** en Supabase (2026-07-22).
- Activar billing en el proveedor del Oráculo para evitar que los prompts personales entrenen
  modelos de terceros (decisión de privacidad, no de costo).

## Principio no negociable
- **Gratis y seguro por encima de todo.** Cualquier herramienta, dependencia o servicio que
  cueste dinero o filtre datos a terceros queda descartado sin excepción. (Por eso se descartó
  impeccable: telemetría a impeccable.style + API de OpenAI.)

## Índice de decisiones clave
- **Dirección visual híbrida (pergamino + acentos de cristal/dorado)** (2026-07-22) — ver BITACORA.md.
- **Seguir con CSS plano; NO migrar a Tailwind/shadcn** (2026-07-22) — churn sin beneficio; ver BITACORA.md.
- **Groq como Oráculo por defecto, no Gemini** (2026-07-22) — free tier viable + contrato compartido; ver BITACORA.md.
- **Proveedor de IA intercambiable** (no negociable) — `callAgent(prompt, context)` decide proveedor; ver CONTEXT.md.
- **Sin encabezado automático de capítulo por entrada** (2026-07-22) — descartado; ver BITACORA.md.
- **Textos de UI usan "página/páginas", no "crónica"** (2026-07-22) — ver BITACORA.md.
- **Solsticio/equinoccio por fechas fijas aproximadas**, no cálculo astronómico exacto (2026-07-22) — ver BITACORA.md.
- **El lore vive en la base de datos, nunca en el prompt** — contexto mínimo por entrada; ver CONTEXT.md.
