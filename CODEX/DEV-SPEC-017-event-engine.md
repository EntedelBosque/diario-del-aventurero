# DEV-SPEC-017 — EVENT ENGINE
> Los Motores se comunican por **Eventos**, sin depender directamente entre sí.

## Principio
Todo cambio importante = un Evento. Un Motor nunca modifica a otro directamente.

## Eventos (ejemplos; ampliable)
JournalCreated, ChronicleGenerated, ContractCompleted, MissionCompleted, AchievementUnlocked,
BossDamaged, RelationshipUpdated, RealmChanged, EntityDiscovered, OracleFailed.

## Responsabilidad
Cada Motor escucha solo los eventos que necesita. Nunca modifica otro Motor.

## Persistencia
Todo evento se **registra antes** de procesarse.

## Alcance
Define eventos/comunicación/responsabilidades/persistencia. NO implementación, Event Bus ni infraestructura.

## Estado (Claude): PENDIENTE (FOUNDATION). Ya existe `world_events` como semilla de log de eventos.
## Sirve de columna vertebral para 014/016/018. Recomendado construir temprano.
