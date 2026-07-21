# ADDENDUM-003 — Implementación

Este documento registra la implementación técnica aprobada por ADDENDUM-003.

## Cambios aplicados

- Las migraciones `013` a `016` agregan el esquema universal de contenido, plantillas narrativas, evidencia de bosses y el registro global de nombres oficiales.
- El `slug` se crea una sola vez desde el nombre inicial y es estable; una edición posterior del nombre no lo recalcula.
- El Oráculo debe proponer `category` en cada actividad. El Motor valida esa categoría contra `guild_categories` activo y desde allí resuelve el o los gremios. La XP de progresión no contiene asignaciones de gremio por estadística.
- `allocateGuildExperience` en `src/core/domain/guilds.ts` es el único algoritmo de reparto entero con conservación de XP para gremios.
- La evidencia de boss es append-only. La evidencia operativa es la suma posterior a la última fila de reset, o a `appeared_at` si no existe reset.
- Antes de crear contenido oficial, el Motor normaliza el nombre y consulta `official_name_registry`; igualdad exacta queda bloqueada por la base y similitud `pg_trgm > 0.6` requiere revisión manual.

## Decisiones diferidas

- No se implementan rendimientos decrecientes para actividades `muy_pequena`: los valores 100/50/0 siguen pendientes de aprobación del Game Director.
- No se implementa la capa `Influence` en este MVP.
- La evidencia no puede provenir de otro boss: solo de un evento o contrato.
- Las semillas con el texto de plantillas narrativas siguen fuera de alcance; esta entrega crea exclusivamente su estructura y auditoría de uso.
