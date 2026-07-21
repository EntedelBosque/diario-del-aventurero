# CODEX-009 - Implementacion del Director del Juego

**Fuente:** CODEX-009 El Director del Juego v1.0.0  
**Estado:** nucleo determinista aprobado  
**Ultima actualizacion:** 2026-07-21

## Funcion

El Director recibe señales persistentes calculadas por el Motor: areas
descuidadas, capacidad de contratos, necesidad de recuperacion, bosses activos
y señales estacionales. Devuelve propuestas estructuradas y ordenadas; no
escribe estado ni interpreta lenguaje.

El Motor conserva la decisión final y ejecuta cualquier cambio dentro de su
transaccion. Cada observacion y propuesta queda registrada para poder auditar
por que se sugirio una experiencia.

## Parametros pendientes

CODEX-009 no define limites de contratos, duracion de abandono, cadencias ni
calendario personal. Esos valores se calculan fuera del Director y se entregan
en su snapshot. No se usan limites o fechas inventados.
