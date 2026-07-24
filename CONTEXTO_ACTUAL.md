# Contexto Actual — Diario de un Aventurero
> Primer compacto para retomar el proyecto. Léelo antes que nada.
> Última actualización: 2026-07-23 · Versión: 0.18.0

## Stack y conexiones (para cualquier agente/IA que retome)
- **App:** Next.js 15 (App Router) + React 19, TypeScript, PWA. Hosting en **Vercel** (deploy auto al hacer push a `main`).
- **Datos:** **Supabase** (Postgres) = fuente de verdad. Cliente navegador con `@supabase/ssr` (anon key);
  servidor con service-role (`src/adapters/persistence/supabase-server.ts`). Migraciones en `supabase/migrations/`.
- **IA (Oráculo):** proveedor intercambiable; por defecto **Groq**, alternativa Gemini (`src/adapters/oracle/`).
  El prompt del sistema vive en `src/adapters/oracle/oracle-prompt.ts` (compartido entre proveedores).
- **Secretos:** NO están en el repo (`.env`/`.env.local` en `.gitignore`). Viven en Vercel env + `.env.local` local:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, API key del proveedor IA.
- **Arquitectura:** hexagonal. Núcleo en `src/core` (dominio + aplicación, sin framework, con tests). Adaptadores
  en `src/adapters`. UI en `src/app`. Specs de juego en `CODEX/` y `CONTEXT.md`.

## En una línea
RPG personal persistente: Fernando escribe entradas de diario en lenguaje natural, un Oráculo IA las convierte
en narrativa épica + JSON estructurado, y el Motor determinista aplica progresión (XP, estadísticas, gremios,
economía, mundo) sobre Supabase. La vida real siempre gana; el juego se adapta, nunca castiga por vivir.

## Qué funciona hoy (5 pestañas)
- **Diario:** panel de estadísticas del Aventurero (nivel, XP, 6 stats con Disciplina, gremios a los que
  perteneces con su nivel), formulario "Añadir página", **reseña unificada** al enviar (misma `PageCard` que
  Relatos, con pie completo: ✨XP, 🟡oro, 🔥Disciplina, deltas de stats, ⚜️gremio, 🗺️hallazgos), y
  "Tu último relato…" persistente. Toca una stat o gremio → **glosario** (qué es y cómo se gana).
- **Relatos:** biblioteca por árbol **Edad (año) → Época (mes) → páginas**, páginas numeradas, pie de ganancias.
- **Mundo:** **Gremios · Afinidad** (los 6, con unión a 50 y niveles de material a partir de 150) + entidades
  agrupadas por tipo (Personajes, Lugares, Conocimientos, Herramientas, Objetos, **Reinos y Órdenes**). Tocar una
  entidad abre su **ficha**: alias legendario (Título Vigente), semblanza evolutiva, **afinidad/rango**, primera
  aparición y **Archivo de Honores** (títulos previos).
- **Misiones / Mercado:** vistas reales cableadas; vacías hasta que existan generadores (Mercado muestra tu oro real).

## Motor y progresión (cómo se otorga todo)
- El Oráculo devuelve JSON validado (título, narrativa, actividades con categoría∈vocabulario cerrado y
  clasificaciones que suman 100, entidades con alias+semblanza, evidencias de contrato/boss).
- `RunMotor` calcula XP (**escala 1–10 por actividad**) y reparte a gremios; emite `playerExperienceDelta` y
  `currencyDelta` (monedas = XP) al RPC `persist_motor_effects`.
- En `route.ts` (capa app, no en el RPC): se **acreditan las estadísticas base** desde las clasificaciones, se
  **sube Disciplina +1** por entrada (DEV-SPEC-019 Fase 1, tope 100), y se **persisten las entidades** del mundo.
- Gremios: unión a **50** de afinidad, +**100** por nivel de material (Madera, Piedra, Bronce…) → `guild-tiers.ts`.
- Reputación de entidad = nº de menciones (`importance_level`) → rango en `reputation.ts`.

## Living World (DEV-SPEC-013) — en curso
Ver `CODEX/DEV-SPEC-013-living-world.md`. **Hecho:** memoria append-only, alias/semblanza que evolucionan al
re-mencionar (conservando el descubrimiento), afinidad por menciones, el Oráculo **consulta la verdad actual**
(su contexto ya trae título vigente + semblanza por entidad) y tiene prohibido contradecirla o confundir el
reino del Aventurero con el de otra persona; **títulos legendarios** obligatorios (prohibido roomie/amigo/jefe…);
Título Vigente = alias más reciente + Archivo de Honores. **Pendiente:** modelo explícito de **Eras / Reino
activo vs Archivo Histórico** (XalDigital→Bizee), evolución de relaciones con etapas nombradas, editor manual de
semblanza en la ficha (plan B si la autocorrección del Oráculo no basta para casos como "Seasons" stale).

## Roadmap por fases
- **F1 El Mundo vivo — ✅ COMPLETA.**
- **Living World avanzado (Eras/Reino activo/Archivo de Honores explícito)** — siguiente lógico.
- **Motor de Tiempo** — destraba el **decay de Disciplina** (DEV-SPEC-019 Fase 2, recalculo 30 días) y las
  **notificaciones tipo Duolingo** (comparten el job programado diario).
- **F2 Libro épico (UI):** rediseño "librería/estantería" de Relatos. (Pie de ganancias y tono épico ya hechos.)
- **F3 Generadores:** contratos (Director del Juego) → Misiones; artículos de Mercado.
- **F4 Economía/combate:** canjear monedas; bosses/misiones con daño.
- **F5 Robustez:** tests de endpoints, paginación, verificar backups.
- **Futuro pedido por Fernando:** tablero de **logros** + compartir a Instagram (imagen + Web Share API).

## Bugs arreglados en esta sesión (23 jul)
- XP y **monedas** ahora se acreditan (el Motor emitía campos que el RPC no leía).
- **Estadísticas base** ahora suben (el RPC solo tocaba Disciplina; se acreditan en la capa app).
- **Disciplina** sube +1 por entrada y muestra su rango interpretativo.
- **Refresco instantáneo** de stats/disciplina al enviar (`cache:"no-store"` + `force-dynamic` + refreshKey).
- **Relatos** ya no salía vacío (embed 1-a-1 se leía como array).
- Reseña unificada muestra TODO lo ganado en un solo lugar.

## Sostenibilidad
3 entradas/día ≈ ~10–20 MB/año → **décadas** dentro de los 500 MB del free tier de Supabase; IA **$0** (~90 req/mes).
Riesgo real = operativo (proyecto free se pausa a los 7 días de inactividad; backups automáticos limitados), no capacidad.
Backups: por ahora se confía en los automáticos de Supabase (no se guarda copia en la máquina de Fernando).

## Principios no negociables
- **Gratis y seguro por encima de todo.** Nada que cueste dinero o filtre datos entra (por eso se descartó impeccable).
- **Proveedor de IA intercambiable.** Ningún adaptador acopla lógica a un proveedor.
- **El lore vive en la base de datos, nunca en el prompt.** Contexto mínimo por entrada.
- **La historia nunca se reescribe** (memoria append-only); el mundo se preserva y continúa.
- **Textos de UI en "página/páginas"**, tono **épico RPG** (fantasía pero fiel a los hechos reales).
- **CSS plano + variables** (no Tailwind/shadcn). Íconos SVG propios. Animación CSS.

## Índice de decisiones clave (detalle en BITACORA.md)
- Dirección visual híbrida pergamino + acentos cristal/dorado; look "códice iluminado" + RPG (grano, marco, tomos).
- Sistema de puntos escala **1–10** por actividad (evita totales gigantes).
- Gremios: unión a 50, niveles de material cada +100.
- Disciplina +1/crónica (Fase 1); decay = Fase 2 con Motor de Tiempo.
- Título Vigente = último alias; Archivo de Honores = resto del arreglo `aliases`.
- Los dev-specs del Game Designer son **guías**; Claude decide la solución técnica alineada a la filosofía.
- Claude Pro NO mejora el PWA (solo la experiencia de desarrollo).

## Pendientes manuales (fuera del repo)
- `supabase/reset_progress.sql` disponible para poner en cero XP/nivel/stats/gremios/monedas (SQL Editor).
- Migraciones al día. Si se agregan gremios/categorías, actualizar el enum del prompt Y `guild_categories`.
