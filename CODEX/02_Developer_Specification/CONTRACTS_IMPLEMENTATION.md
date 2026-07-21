# CODEX-005 - Implementacion del sistema de contratos

**Fuente:** CODEX-005 Sistema de Contratos v1.0.0  
**Estado:** nucleo de contratos aprobado  
**Ultima actualizacion:** 2026-07-21

## Regla central

Todo objetivo del juego es un contrato. No se crearán sistemas paralelos de
tareas, habitos ni recordatorios. Un contrato almacena objetivo, estado,
recompensa, vigencia, dificultad, categorias, prioridad y origen.

El Oraculo puede aportar evidencia relacionada, pero no puede crear, completar,
fallar ni expirar contratos. Esas transiciones pertenecen exclusivamente al
Motor y quedan registradas en `contract_history`.

## Vigencias iniciales

- Diario: 24 horas.
- Semanal: 7 dias.
- Mensual: 30 dias.

Campañas, Grandes Destinos, Obras Magnas y contratos especiales, dinamicos o
de recuperacion reciben una vigencia explícita del Motor. Los limites de
contratos diarios y las reglas de generación adaptativa siguen pendientes del
Developer Specification.

## Filosofia

Un contrato fallido, expirado o cancelado solo pierde su recompensa potencial:
nunca elimina XP, nivel ni progreso historico.
