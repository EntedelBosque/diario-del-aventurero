# Contexto Actual — Diario de un Aventurero
> Primer compacto para retomar el proyecto. Léelo antes que nada.
> Última actualización: 2026-07-22 · Versión: 0.15.0

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
- Pestañas pendientes de contenido real: Mundo, Misiones, Mercado (hoy son placeholders).

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
