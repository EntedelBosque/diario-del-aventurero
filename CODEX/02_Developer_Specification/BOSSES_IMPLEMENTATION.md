# CODEX-006 - Implementacion de bosses y campanas

**Fuente:** CODEX-006 Sistema de Bosses y Campañas v1.0.0  
**Estado:** nucleo de bosses aprobado  
**Ultima actualizacion:** 2026-07-21

## Autoridad y daño

El Oráculo sólo puede proponer evidencia relacionada con un boss. El Motor
valida esa evidencia frente a eventos y contratos completos, calcula el daño y
guarda cada resultado en `boss_damage_history`. Ningún cliente o proveedor de
IA puede establecer vida o daño directamente.

La fórmula de daño no se implementa todavía: CODEX-006 enumera los factores,
pero no define pesos. El núcleo acepta únicamente un daño ya calculado por el
Motor y exige al menos una fuente de evidencia.

## Ciclo de vida

`descubierto → activo → debilitado → derrotado → archivado`. La primera
reducción válida de vida marca al boss como debilitado; cuando la vida alcanza
cero, el Motor lo derrota. Los bosses no fallan ni reciben daño automático.
Campañas y contratos se vinculan sin crear un sistema de objetivos paralelo.
