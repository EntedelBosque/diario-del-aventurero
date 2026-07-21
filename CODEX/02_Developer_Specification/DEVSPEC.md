# Developer Specification - Diario de un Aventurero

**Documento unico.** Complementa The Living Codex con decisiones de construccion; no inventa mecanicas. Si difiere del codigo de `main`, prevalece el codigo salvo regresion demostrable.

## Arquitectura y stack

La IA interpreta, el Motor decide y Supabase conserva la memoria. La aplicacion sera una sola PWA Next.js con TypeScript estricto, route handlers, Supabase, Gemini Flash detras del puerto `OracleAgent` y despliegue en Vercel. `src/core/domain` es puro y no puede importar framework, base de datos ni SDK de IA.

## Reglas de fiabilidad

- UUID en toda entidad; enteros para XP, monedas y dano.
- RLS activo. El cliente solo lee; el backend con service role ejecuta escrituras del Motor.
- Historiales append-only y comandos mutables idempotentes.
- Las tablas mutables usan `created_at`, `updated_at` y `version` para optimistic locking.
- La correccion retroactiva de ocho tablas se realiza en `202607210012_optimistic_locking_backfill.sql`, con `bump_version_generic()` validado contra PostgreSQL 16.

## Contrato del Oraculo

El Oraculo solo propone actividades, entidades, emociones y evidencia de contratos o bosses. No puede enviar puntos, XP, monedas, dano, Disciplina ni transiciones. El contrato validado vive en `src/core/domain/oracle-response.ts` y `CODEX/03_Oracle_Bible/CONTRACT.md`.

## Estado y roadmap

El dominio, migraciones y pruebas unitarias estan implementados. El siguiente paso es el caso de uso **Motor**, que orquesta en transaccion: progresion, gremios, contratos, bosses, economia y Director. Despues siguen el adaptador Supabase, adaptador Gemini, PWA, autenticacion, pruebas de integracion y despliegue.

## Reglas operativas

Toda mecanica requiere Codex o especificacion previa. Cada cambio de esquema es una migracion nueva; cada modulo de dominio lleva pruebas. Cualquier cambio del contrato del Oraculo actualiza codigo y Biblia en el mismo cambio.
