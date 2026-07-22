# 🎨 Diario del Aventurero — Design System & UI

Guía estándar para cualquier vista de UI del proyecto. Léela antes de crear o modificar
componentes visuales. La visión de producto y la arquitectura están en `CONTEXT.md`; el estado
vivo del proyecto en `CONTEXTO_ACTUAL.md`.

## Visión de diseño
PWA mobile-first con estética de **códice / grimorio barroco (dark academia, paleta otoñal)**.
Dirección **híbrida**: base de **pergamino cálido** (lo ya enviado) con **toques puntuales de
cristal ahumado y brillo dorado** donde aporten jerarquía o momento (p. ej. la tarjeta del
Oráculo). No es glassmorphism obsidiana total: el cristal es acento, no el fondo.

## Stack (decisión de arquitectura)
- **CSS plano + variables** en `src/app/globals.css`. **No** migramos a Tailwind ni shadcn/ui:
  añadirían churn y un look SaaS genérico que pelea con la estética de grimorio, sin beneficio.
- **Íconos: SVG propios** (como `src/shared/icons/QuillIcon.tsx`), no librerías de íconos
  genéricos — encajan mejor con el tema RPG.
- **Animación: CSS** (`transition`, `@keyframes`, `active:`). Solo se evaluará una librería de
  motion si una interacción concreta necesita física que CSS no dé; hoy no hace falta.
- **Restricción no negociable:** todo debe seguir **gratis, sin dependencias que filtren datos y
  sin llamadas a APIs externas de terceros** desde la UI. Cualquier herramienta nueva se valida
  contra esto antes de entrar.

## Tokens (fuente de verdad: `globals.css`)
Usa siempre variables CSS, nunca hardcodees el color:
```
--bg #1c1310        fondo obsidiana cálida        --parchment #ddc9a3   pergamino
--surface #2b1e18   contenedores oscuros           --ink #efe3cf         texto sobre oscuro
--brass #b08d57     latón (bordes/acentos)         --ink-on-parchment #2e2015
--gold #c9a227      dorado rúnico (énfasis)        --burgundy #6e2a2a    borgoña (celeste/resaltado)
```
Tipografía: **Cinzel** (títulos/headline, serif display), **Garamond** (narrativa, serif),
**Source Sans** (UI/cuerpo). Ya cargadas como `--font-cinzel`, `--font-garamond`, `--font-source-sans`.

## Reglas de interfaz (PWA mobile-first)
- **Touch targets** ≥ 44×44px en todo lo clickeable.
- **Safe areas de iPhone:** respeta `env(safe-area-inset-*)` (ya aplicado en `main` y `.bottom-nav`).
- **Inputs a 16px mínimo** para evitar el zoom automático de iOS al enfocar.
- **Feedback táctil inmediato:** `active:scale` / `transition` en botones (el sello ya lo hace).
- **Sin scrollbars innecesarios**; el cuerpo nunca hace scroll horizontal.
- **Respeta `prefers-reduced-motion`:** las animaciones decorativas se desactivan.

## Toques híbridos (cristal + brillo), con moderación
- Cristal ahumado como **acento** en tarjetas destacadas: fondo semitransparente sobre el
  pergamino/oscuro + `backdrop-filter: blur()` sutil + borde `--brass` tenue.
- Brillo dorado (`box-shadow` con `--gold` a baja opacidad) para marcar el momento del Oráculo o
  una recompensa, no en todo.
- Regla de oro: si un efecto no mejora jerarquía o legibilidad, va fuera. Menos es más.

## Componentes de referencia (nomenclatura del proyecto)
Recuerda: en la UI decimos **"página"/"páginas"**, nunca "crónica".
1. **Parchment card** — contenedor pergamino con textura y borde de latón (clase `.parchment`).
2. **Page card** — la página narrada del Oráculo: timestamp de aventurero, título evocador,
   narrativa en Garamond, recompensas (XP + gremios). Candidata #1 al acento de cristal/brillo.
3. **Seal button** — botón-sello de envío con ícono de pluma.
4. **Bottom nav** — 5 pestañas (Diario, Personaje, Mundo, Misiones, Mercado). Faltan íconos
   propios de las últimas 4 (siguiente lote de diseño).

## Skills de diseño disponibles (instaladas en `.claude/skills/`)
Apóyate en ellas al trabajar UI:
- **`emil-design-eng`** — polish, detalles finos y decisiones de animación.
- **`apple-design`** — materiales translúcidos, movimiento físico, tipografía, reduced-motion.
- **`review-animations`** — revisión estricta de motion (invócala explícitamente).
- **`design-taste-frontend`** — dirección anti-"slop", evita UI templada.
- **Claude Design / DesignSync** (`/design-sync`) — sincroniza componentes con el design system
  en claude.ai/design para verlos renderizados; flujo incremental, componente por componente.

## Regla de proceso
Al tocar cualquier vista: aplica estos tokens y reglas, verifica en móvil (safe areas, touch,
16px inputs, reduced-motion), y si tomaste una decisión de diseño con un *porqué*, regístrala con
la skill `diario-del-aventurero`.
