# Bitácora — Diario de un Aventurero
> Registro cronológico por sesión (más reciente arriba). El *qué* y sobre todo el *porqué*.
> La mantiene la skill `bitacora` (`.claude/skills/bitacora/`).

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
