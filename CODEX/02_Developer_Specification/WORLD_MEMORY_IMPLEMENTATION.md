# CODEX-004 - Implementacion de la memoria del mundo

**Fuente:** CODEX-004 La Memoria del Mundo v1.0.0  
**Estado:** estructura de memoria aprobada  
**Ultima actualizacion:** 2026-07-21

## Modelo

`world_entities` es el registro de identidad para toda entidad descubierta.
Cada fila se crea desde un evento validado, mantiene su identificador y nunca
se elimina. Las tablas especializadas son proyecciones con sus datos propios:
personajes, lugares, conocimientos, herramientas, objetos y organizaciones.

`entity_history` conserva cada cambio, mientras que `entity_relationships`
guarda relaciones explícitas y buscables. Una fusión marca la entidad origen
con su entidad canónica; no borra eventos, historial ni identidad previa.

## Autoridad

El Oráculo devuelve sugerencias de entidad. El caso de uso debe resolverlas
contra entidades existentes y crear, actualizar o fusionar sólo mediante el
Motor y una transacción. Los prompts reciben únicamente las entidades
relevantes, no el historial completo.

## Evento histórico

Cada `world_event` puede tener `event_details`, participantes y ubicación. La
descripción original y los hechos no se modifican por una narrativa RPG.
