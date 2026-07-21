# Changelog - Diario de un Aventurero

## [0.8.0] - 2026-07-21
- Se incorpora CODEX-005: contratos con vigencia, prioridad, dificultad, categorias, recompensas, evidencia e historial inmutable.
- El Oraculo migra de `questsCompleted` a `contractEvidence`; no puede modificar el estado de un contrato.
- Se unifica el contrato JSON en camelCase y se agrega versionado optimista para contratos.

## [0.7.0] - 2026-07-21
- Se implementa CODEX-004 con memoria persistente, historial, relaciones y entidades buscables del mundo.
- Se agregan proyecciones para lugares, conocimientos, herramientas, objetos, organizaciones, detalles y participantes de eventos.
- Los eventos y entidades no pueden eliminarse; el cliente solo puede leer la memoria y el Oraculo solo sugerir entidades.

## [0.6.0] - 2026-07-21
- Se implementa el Motor determinista de XP de CODEX-003 y el ledger de experiencia general y de gremios.

## [0.5.0] - 2026-07-21
- Disciplina se corrige a estadistica derivada visible y se bloquean escrituras directas del cliente sobre estadisticas.

## [0.4.0] - 2026-07-21
- Se incorpora CODEX-002: perfil inicial del Aventurero, cinco estadisticas visibles y cinco gremios.

## [0.3.0] - 2026-07-21
- Se implementa el flujo base de ingreso de entradas con validacion e idempotencia.

## [0.2.0] - 2026-07-21
- Se define la arquitectura base.

## [0.1.0] - 2026-07-21
- Setup inicial del repositorio.
