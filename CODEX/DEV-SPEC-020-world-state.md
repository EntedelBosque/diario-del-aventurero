# DEV-SPEC-020 — WORLD STATE AND HISTORICAL EVOLUTION

> Cómo una Entidad conserva su historia sin perder su estado actual. Solo persistencia/evolución de
> información (no mecánicas, recompensas, narrativa ni generación). Complementa DEV-SPEC-013.

## Principio
Toda Entidad tiene **Estado Vigente** (la realidad actual) + **Historial** (todas las etapas anteriores).
Nunca se elimina ni se sobrescribe historia: **toda modificación genera una nueva etapa** (append-only).

## Estado Vigente (lo único que usa el Oráculo)
- **Título Legendario Vigente:** exactamente uno por persona; el Oráculo lo usa en todas las crónicas.
- **Reino Activo:** una persona tiene un solo Reino de Trabajo activo; jamás dos a la vez; el Motor
  siempre usa el activo, nunca uno archivado.
- **Etapa Vigente de relación:** una sola (compañero → amigo → aliado → confidente…).
- Antes de cada crónica, el Oráculo consulta SIEMPRE el Estado Vigente; nunca usa lo archivado como vigente.

## Historial (inmutable)
- **Archivo Histórico de Reinos:** nombre, fecha inicio, fecha fin, motivo, orden cronológico.
- **Archivo de Honores (títulos):** título, fecha otorgamiento, fecha reemplazo, motivo, orden. Solo
  histórico; el Oráculo NUNCA lo usa para generar.
- **Historial de relaciones:** cada transición crea un registro nuevo, nunca modifica los anteriores.
- El Historial jamás se modifica, elimina ni reordena. Toda corrección futura = nuevo registro.

## Alcance
Define persistencia (Estado Vigente, Archivo Histórico, Reino Activo, Archivo de Honores, etapas de
relación). NO define cuándo/cómo ocurre una evolución ni los criterios de promoción → eso es del
**Director del Juego** (documentos aparte, aún no cableado).

---

## Estado de implementación (Claude) — decisión de arquitecto
Se implementó la garantía central (Estado Vigente + Historial inmutable) sobre las tablas existentes,
sin migración:
- ✅ **Historial inmutable** en `entity_history` (append-only, trigger anti-borrado). Cada cambio de
  **Título Vigente** o **semblanza** (Estado Vigente) inserta un registro con `before/after`, evento
  fuente y fecha. Se lee vía `getEntityHistory` / `GET /api/entity-history` (scoped al dueño).
- ✅ **Título Vigente** = alias más reciente; **Archivo de Honores** = títulos previos; ambos visibles
  en la ficha de Mundo, más la línea de tiempo del Historial con fechas.
- ✅ **Estado Vigente** = alias vigente + `observations` (semblanza, que incluye el reino actual de la
  persona). El Oráculo solo recibe el Estado Vigente en su contexto (nunca el Historial).
- ⏳ **Reino Activo como entidad-relación estructurada** (con fecha inicio/fin/motivo propios, separado
  de la semblanza): representado hoy DENTRO de la semblanza vigente + archivado en `entity_history` al
  cambiar. Modelarlo como relación de primera clase (tabla `entity_relationships`) se hará cuando exista
  el **Director** que dispare/apruebe la transición (la spec deja ese "cuándo" al Director).
- ⏳ **Etapas de relación** nombradas (compañero→amigo→…): igual, requieren el Director para promover.
