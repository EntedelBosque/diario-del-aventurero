# Diario de un Aventurero

Un RPG personal persistente: los hechos de la vida se conservan como eventos y el mundo los interpreta mediante reglas deterministas y narrativa opcional.

## Estado

La primera fase define la arquitectura. Aun no hay interfaz ni conexion a Supabase: se establecen los limites que permitiran construir ambas sin deuda estructural.

## Arquitectura elegida

Una unica aplicacion **Next.js + TypeScript** contendra la PWA y su API. El nucleo del juego no dependera de Next, React, Supabase ni de un proveedor de IA. Supabase sera la fuente de verdad persistente y la IA sera un adaptador intercambiable que solo propone una interpretacion estructurada.

La descripcion completa esta en [CODEX/02_Developer_Specification/ARCHITECTURE.md](CODEX/02_Developer_Specification/ARCHITECTURE.md).

## Proximo paso

Implementar el vertical slice de una entrada de diario: registrar el hecho, validar la propuesta del Oraculo, aplicar reglas deterministas y mostrar el resultado.
