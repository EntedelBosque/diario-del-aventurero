# Bitácora — Diario de un Aventurero
> Registro cronológico por sesión (más reciente arriba). El *qué* y sobre todo el *porqué*.
> La mantiene la skill `bitacora` (`.claude/skills/bitacora/`).

## 2026-07-23 — Living World (títulos vigentes/archivo), Disciplina (DEV-SPEC-019), fix refresco

- **Fix refresco:** los stats/disciplina no se veían sin cambiar de pestaña. Causa: caché del navegador
  en los GET. Solución: `cache: "no-store"` en las llamadas a /api/player, /api/world y /api/diary-entries
  (+ el refreshKey del StatsPanel que ya bumpea al enviar).
- **DEV-SPEC-019 (Disciplina):** mi Fase 1 (+1/crónica, tope 100) ya coincidía. Añadí los **rangos
  interpretativos** (Legendaria…Descuidada) en la UI. Fase 2 (recalculo 30 días + decay) requiere el
  **Motor de Tiempo** (job programado) — misma infra que las notificaciones. Spec en `CODEX/DEV-SPEC-019-discipline.md`.
- **Living World:** el **Título Vigente** de una entidad ahora es el alias más reciente (antes tomaba el
  primero, bug); la ficha muestra el **Archivo de Honores** con los títulos previos.
- **Nota sobre dev-specs:** Fernando confirmó que son guías; yo decido la solución técnica alineada a la
  filosofía. (Ej.: título vigente = último alias; archivo = resto del arreglo `aliases`.)
- **Diana/Seasons:** el mecanismo de autocorrección ya existe (el Oráculo respeta la semblanza actual y la
  actualiza con nuevas entradas). Para corregir: escribir una entrada aclarando el hecho; no se reescribe
  el pasado, se continúa. Pendiente mayor: modelar "Reino activo vs Archivo Histórico" (Eras) explícito.

## 2026-07-22 — Gremios con pertenencia/niveles, último relato, pie de ganancias

- **Gremios ahora se "unen":** `guild-tiers.ts` — te unes a los **50** de afinidad; cada **+100** subes
  de material (150 Madera, 250 Piedra, 350 Bronce…). En Diario solo aparecen los gremios a los que
  perteneces (≥50), con su nivel; en Mundo se ve el estado y el progreso al siguiente escalón.
- **Diario:** persiste "Tu último relato…" (última página guardada) hasta que se añada otra.
- **Pie de ganancias por página** (Relatos + último relato): XP, monedas, deltas de estadísticas,
  hallazgos y misiones/bosses — derivados de la respuesta guardada del Oráculo (sin tocar tablas de
  auditoría). Componente `PageCard` compartido.
- **Reset:** se quitaron las líneas de borrado del mundo (memoria append-only por diseño).

### Decisión: balance de afinidad de gremios (escala 1–10)
- **Por qué:** con la escala 1–10, un gremio gana ~3–6 por entrada en su categoría → **unirse (50)** ≈
  ~2 semanas de actividad casi diaria en ese dominio; **~100** ≈ 3–4 semanas; cada nivel (+100) ≈ ~1 mes.
  Es un slow-burn intencional (solo "vives" los gremios que de verdad practicas).
- **Cómo aplica:** si se siente lento/rápido, ajustar `GUILD_JOIN_THRESHOLD`/el paso de 100 en
  `guild-tiers.ts` o el XP por actividad en `progression.ts`.
- **Fecha:** 2026-07-22

## 2026-07-22 — Fase 0 (estadísticas) + Fase 1 (El Mundo vivo)

- **Bug encontrado y arreglado:** las estadísticas base NUNCA subían. El RPC del Motor solo toca
  `disciplina`; no incrementa arte/tecnologia/vitalidad/social/sabiduria. Se acreditan ahora en la
  capa de app (`supabase-player-repository.ts`) desde las clasificaciones de cada actividad, tras el
  Motor. (Monedas y XP ya funcionaban tras el fix anterior — Fernando confirmó 2 monedas.)
- **Reset:** `supabase/reset_progress.sql` (SQL Editor) pone en cero XP/nivel/stats/gremios/monedas,
  conservando diario y mundo. Opcional: borrar world_entities para regenerarlas con alias/semblanza.
- **Fase 1 arrancada:** la Oráculo emite **alias épico** + **descripción evolutiva (≤250)** por entidad;
  la persistencia enriquece alias/semblanza al re-mencionar (conservando el descubrimiento). En **Mundo**:
  sección **Gremios · Afinidad** (barra de maestría, clic → glosario) y **ficha de entidad** (alias, primera
  aparición, semblanza) al tocar una tarjeta. "Organizaciones" → "Reinos y Órdenes".
- **Nota arquitectura:** los incrementos de stats van en la app, no en el RPC determinista (evita
  migración). Ideal a futuro: mover esa lógica al RPC. Registrado como deuda.

## 2026-07-22 — Base sólida: XP/monedas conectadas, puntos 1–10, glosario, ícono

- **Fix de desconexiones Motor→RPC (base sólida):** `RunMotor` ahora emite `playerExperienceDelta`
  y `currencyDelta`. Antes el RPC leía esos campos pero el Motor mandaba `playerExperience` y nada
  de monedas → **el XP del jugador y las monedas NUNCA se acreditaban en producción**. Sin migración
  (el RPC ya estaba correcto). Guild XP sí funcionaba (campo `activities` coincidía).
- **Reescala de puntos a 1–10 por actividad** (base 1–6, tiempo 0–2, gente 0–1, descubrimiento 0–1).
  **Porqué:** Fernando no quiere ganancias "extremistas" (+65) que inflen los totales tras 100 entradas.
  Tests de progresión actualizados. La curva de nivel se mantiene (base_xp 100), leveleo más lento pero sano.
- **Monedas = XP de la entrada** (`currencyDelta = playerExperience`). Mercado ya mostrará saldo real.
- **Glosario:** tocar una estadística o gremio abre un popover con qué significa y cómo se gana
  (`src/shared/glossary.ts` + `GlossaryModal`).
- **Relatos:** páginas numeradas (la más antigua = Página 1). Emojis RPG en los encabezados.
- **Barra inferior** subida (evita el corte del home indicator del iPhone).
- **Ícono de la app:** libro + pluma (`src/app/icon.svg` + PNGs regenerados con sharp).

### Pendiente del lote (siguiente): generadores de contenido (contratos/mercado), pie de página en
### Relatos con lo ganado ese día (stats/objetos/boss/misión), y rediseño "librería" de Relatos.

## 2026-07-22 — Pestañas Mundo/Misiones/Mercado + auditoría del proyecto

- **Mundo funcional:** se cableó la escritura de `entitySuggestions` → `world_entities` (upsert
  idempotente) en entradas aceptadas. Antes la Oráculo las sugería pero nadie las guardaba. Ahora
  Mundo se llena con el uso. Página `/mundo` agrupa por tipo.
- **Misiones/Mercado:** vistas reales cableadas (`/api/contracts`, `/api/market`) con estado vacío
  honesto. NO se inventó contenido (contratos/artículos son dominio del Game Designer/Codex).

### Auditoría (hallazgos, 2026-07-22)
- **Economía desconectada:** `RunMotor` no emite `currencyDelta`; el RPC `persist_motor_effects`
  suma 0 a `currency_wallets` → las monedas nunca se acreditan (Mercado siempre 0). Existe
  `economy.ts` y la rama del RPC, pero no están unidas. *Pendiente: cablear.*
- **Sin generadores:** nada crea contratos (Director del Juego no está cableado) ni bosses ni
  artículos de mercado → esas pestañas quedan vacías hasta que Codex defina el contenido.
- **Lecturas con service-role + filtro manual por player_id** (saltan RLS). Bien para 1 usuario;
  para multi-usuario conviene leer con cliente de sesión y RLS.
- **Sin paginación** en Relatos/Mundo (cargan todo). Ok por años; añadir cuando crezca.
- **CRLF churn** (Windows): falta `.gitattributes` con `* text=auto`.
- **Faltan tests** de los endpoints nuevos y de la persistencia de entidades.

### Sostenibilidad (3 entradas/día)
- ~10–14 filas y ~5–10 KB por entrada → ~1,100 entradas/año ≈ ~10–20 MB/año.
- Supabase free = 500 MB DB → **~25–50 años** de datos. Costo IA con 90 req/mes = **$0** (Groq/Gemini free).
- Límite real NO es capacidad sino operativo: el proyecto free **se pausa tras 7 días inactivo**;
  backups automáticos limitados en free → hacer `pg_dump`/export periódico del diario.

## 2026-07-22 — Relatos biblioteca, estadísticas en Diario, look RPG

- **Fix crítico:** `oracle_interpretations.diary_entry_id` es PK → PostgREST lo embebe como objeto
  (1-a-1), no array. `listAcceptedPages`/`toStoredEntry` lo leían como array → Relatos siempre
  vacío. Se lee robusto (objeto o array) con `readInterpretation`.
- **Relatos = biblioteca por árbol:** Edad (año) → Época (mes) → páginas. Drill-down con botón de
  regreso. **Porqué:** Fernando lo pidió así, como hojear una biblioteca.
- **Estadísticas dentro de Diario:** nuevo `GET /api/player` (nivel, XP, stats visibles de
  `player_stats`, maestría de gremios). Panel `StatsPanel` arriba del formulario.
- **Se eliminó la pestaña Personaje:** su hoja de personaje ahora vive en Diario. Nav = 5
  pestañas (Diario, Relatos, Mundo, Misiones, Mercado). `ShieldIcon` queda sin uso.
- **Helper `src/app/api/session.ts`** compartido (getAuthenticatedUser/withSessionCookies).
- **Pase de diseño RPG (sin Claude Design):** grano de pergamino (SVG feTurbulence inline), marco
  interior de latón en la page-card, tomos de biblioteca. **Porqué:** Fernando quiere "más RPG,
  menos limpio". Claude Design no se necesita para esto.

### Decisión: No se usa Claude Design para el look RPG
- **Por qué:** DesignSync solo sirve para sincronizar un sistema de componentes con claude.ai/design;
  la estética se logra con CSS propio + las design skills instaladas. Menos dependencia, gratis.
- **Cómo aplica:** para iterar diseño, usar Artifacts de preview + las skills, no Claude Design.
- **Fecha:** 2026-07-22

## 2026-07-22 — Tarjeta de resultado tipo códice + pestaña Relatos

- **Tarjeta de resultado (page-card) elevada** a estética de códice iluminado: capitular (drop cap)
  en la narrativa, nombres oficiales de gremio en vez de slugs, recompensas como chips con XP
  destacada, divisores con fleurón ◆, glow dorado más sobrio. **Porqué:** a Fernando le encantó
  esta dirección; se sigue por esta línea.
- **Nueva pestaña "Relatos"** (`/relatos`): histórico de páginas aceptadas del diario, mostradas
  como un libro hojeable reusando la page-card. **Porqué:** es literalmente el libro que se va
  escribiendo con cada entrada.
  - `GET /api/diary-entries` lista las páginas aceptadas del jugador; `listAcceptedPages` en el
    repo hace inner join sobre `oracle_interpretations.status = accepted`.
  - `BottomNav` extraído a componente compartido (6 pestañas, ícono de libro); `/relatos` añadido
    al matcher del middleware para exigir sesión.
- **Previews con Artifacts:** se usa un Artifact HTML autónomo para previsualizar el diseño sin
  necesidad de sesión/deploy. A Fernando le gusta este método. **Cómo aplica:** al iterar diseño,
  ofrecer un Artifact de preview además del deploy.

## 2026-07-22 — Fix del Motor (categorías) + ajuste del formulario

- **Bug en producción:** el Motor lanzaba `No active guild is configured for category: Conversación`.
  Causa: el Oráculo emitía categorías en lenguaje libre pero `guild_categories` usa un vocabulario
  cerrado en minúsculas. **Fix:** el prompt ahora restringe `category` a los 9 slugs válidos
  (tecnologia/arte/vitalidad/social/sabiduria/viajes/exploracion/cultura/idiomas) y
  `resolveGuildCodes` normaliza (trim+minúsculas). **Porqué:** una entrada de vida válida no debe
  quedar sin progreso (principio "nunca castiga por vivir").
- **Formulario:** botón redondo de sello reemplazado por botón rectangular "Añadir página"; el
  prompt ahora dice "Relata tu aventura de hoy…". **Porqué:** a Fernando no le gustó el sello redondo.
- **Nota:** la entrada 7dabe232 (previa al fix) quedó registrada pero sin XP; a partir del fix las
  actividades sociales mapean a `vinculos_reino`.

## 2026-07-22 — Sistema de diseño y skills de diseño

- **Skill renombrada** de `bitacora` a `diario-del-aventurero` y hecha explícita del proyecto.
  **Porqué:** se usan otras sesiones de Claude Code para otros proyectos; la skill no debe
  aplicarse fuera de este repo.
- **Se instalaron 3 design skills de terceros** (revisadas antes): `emil-design-eng`, `apple-design`,
  `review-animations` (de emilkowalski/skills) y `design-taste-frontend` (de leonxlnx/taste-skill).
  Se vendorearon solo los `SKILL.md` (+ LICENSE), sin scripts. **Porqué:** guía de gusto/animación
  sin ejecutar instaladores de terceros.
- **Se creó `CLAUDE.md`** con el design system (tokens reales de globals.css, reglas PWA, dirección
  híbrida). **Porqué:** que cualquier sesión futura diseñe UI consistente sin re-explicar el estilo.

### Decisión: Dirección visual híbrida (pergamino + acentos de cristal/dorado)
- **Por qué:** conserva la estética barroca/dark-academia ya enviada y la preferencia documentada
  de Fernando (CONTEXT.md), sumando cristal ahumado y brillo dorado como acento puntual.
- **Cómo aplica:** el cristal es acento (tarjeta del Oráculo, recompensas), nunca el fondo total;
  se descartó el glassmorphism obsidiana propuesto por Gemini.
- **Fecha:** 2026-07-22

### Decisión: Seguir con CSS plano; NO migrar a Tailwind/shadcn
- **Por qué:** el look de grimorio ya está resuelto en CSS plano; Tailwind/shadcn añadirían churn
  y un aspecto SaaS genérico. Restricción global: todo debe seguir gratis y sin filtrar datos.
- **Cómo aplica:** UI en `globals.css` + variables; íconos SVG propios; animación en CSS; evaluar
  motion-lib solo si una interacción concreta lo exige.
- **Fecha:** 2026-07-22

### Decisión: impeccable DESCARTADA (telemetría + API de pago)
- **Por qué:** su CLI envía decisiones de diseño a `impeccable.style` por defecto y usa la API de
  OpenAI (costo + datos a terceros). Fernando la descartó por completo.
- **Cómo aplica:** no volver a proponerla. Regla general confirmada: *toda herramienta que vaya
  en contra de "gratis y seguro" queda descartada sin excepción.*
- **Fecha:** 2026-07-22

## 2026-07-22 — Rediseño de la página de diario + memoria del proyecto

- **Rediseño de la pantalla de diario (commit 16b384a)** — nueva estética pergamino/dark-academia,
  sello de envío con ícono de pluma, tarjeta de página con timestamp de aventurero y título
  evocador por página. **Porqué:** el diario es la superficie principal en el iPhone; debía
  sentirse como un códice, no como un formulario.
- **Soporte de múltiples actividades por evento** (migración 025 + campo `title` en el contrato
  del Oráculo). **Porqué:** una sola entrada de diario puede contener varias actividades distintas
  y cada una debe puntuar por separado.
- **Timestamp de aventurero con detección de solsticio/equinoccio** (`src/shared/format-date.ts`).
  **Porqué:** refuerza la ambientación de "reino"; se acepta que las fechas celestes son
  aproximadas por practicidad.
- **UX de sesión (commit 32aa981)** — redirección de login si ya hay sesión y botón de cerrar sesión.
- **Se creó la skill `bitacora`** y los archivos vivos `CONTEXTO_ACTUAL.md` y `BITACORA.md`.
  **Porqué:** el proyecto avanza en sesiones cortas con varias IAs; el conocimiento y el porqué de
  las decisiones deben vivir en el repo, no en el context window de una conversación.

### Decisión: Sin encabezado automático de capítulo por entrada
- **Por qué:** Fernando lo descartó explícitamente; añade estructura que no aporta al loop actual.
- **Cómo aplica:** no reintroducir agrupación automática de entradas en "capítulos" sin pedírselo.
- **Fecha:** 2026-07-22

### Decisión: Textos de UI usan "página/páginas", no "crónica"
- **Por qué:** preferencia de nomenclatura de Fernando para la interfaz.
- **Cómo aplica:** al escribir copy de UI, usar "página"/"páginas" para referirse a una entrada narrada.
- **Fecha:** 2026-07-22

### Decisión: Solsticio/equinoccio por fechas fijas aproximadas
- **Por qué:** el cálculo astronómico exacto varía ±1 día según el año; para uso personal las
  fechas calendario fijas bastan y evitan complejidad.
- **Cómo aplica:** no invertir en cálculo astronómico real salvo que se pida; documentar el
  aviso de aproximación.
- **Fecha:** 2026-07-22

## 2026-07-22 (previo) — Motor de efectos persistido (migraciones 022–025)

- Se implementó y aplicó el RPC `persist_motor_effects` cubriendo las 6 ramas (actividades/XP de
  gremio, nivel de jugador, contratos, bosses, economía, disciplina), con lock optimista e
  idempotencia por `world_event_id`. Validado con suite E2E. Detalle en `COMPLETADO.md`.
- **Porqué:** cerrar el vertical slice de "una entrada de diario" con efectos persistentes reales
  y exactly-once, sin duplicados en re-ejecución.

### Decisión: Groq como Oráculo por defecto, no Gemini
- **Por qué:** free tier viable sin billing y contrato de prompt compartible; mantiene el principio
  de proveedor intercambiable (`callAgent` abstracto).
- **Cómo aplica:** al tocar adaptadores de Oráculo, no acoplar lógica a un proveedor; cualquiera
  debe cumplir el mismo contrato JSON.
- **Fecha:** 2026-07-22
