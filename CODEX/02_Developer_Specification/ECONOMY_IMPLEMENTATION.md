# CODEX-007 - Implementacion de economia y recompensas

**Fuente:** CODEX-007 Sistema de Economia y Recompensas v1.0.0  
**Estado:** nucleo de economia aprobado  
**Ultima actualizacion:** 2026-07-21

## Moneda y autoridad

La unica moneda inicial es `monedas_aventurero`. Es virtual y no representa
dinero real. El Motor acredita monedas exclusivamente desde acciones validas;
la IA y el cliente no pueden modificar saldos.

Cada movimiento escribe un registro inmutable con saldo resultante. Los canjes
del Mercado usan una clave de idempotencia por jugador, por lo que una misma
solicitud no puede descontarse dos veces. El saldo nunca puede ser negativo.

## Mercado

El Aventurero puede crear recompensas personales, pero sólo el Motor procesa
su canje. El catálogo no contiene mejoras de estadísticas, XP o nivel.
Recomendaciones de recompensa siguen pendientes del Motor adaptativo: nunca se
aplican automáticamente.
