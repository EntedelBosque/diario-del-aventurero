# CODEX-ARCH-002 - Regla de ingreso de entradas

**Estado:** aprobado para la primera entrega vertical  
**Ultima actualizacion:** 2026-07-21

## Regla

Una entrada de diario constituye un hecho declarado por el jugador. El sistema debe guardarla antes de solicitar una interpretacion al Oraculo. Ningun fallo de proveedor puede borrar, modificar o impedir registrar el hecho.

## Alcance de esta entrega

Esta entrega registra la entrada, valida y conserva la respuesta del Oraculo, y garantiza idempotencia. Todavia no modifica estadisticas, personajes, conocimiento, misiones ni bosses: sus reglas de progresion no existen aun como documentos del Codex y no se inventaran en codigo.

`accepted` significa que la respuesta coincide con el contrato tecnico del Oraculo; no significa que sus propuestas hayan alterado el mundo.

## Criterios de aceptacion

1. Texto vacio, fecha invalida o claves requeridas ausentes se rechazan antes de persistir.
2. `(player_id, idempotency_key)` identifica un unico ingreso; una repeticion devuelve el resultado inicial y no vuelve a invocar al Oraculo.
3. La respuesta del Oraculo se valida de forma estricta antes de persistirse como aceptada.
4. Si la respuesta es invalida o el proveedor falla, la entrada queda almacenada y se registra el motivo.
5. El uso de `OracleAgent` permite reemplazar Gemini sin cambiar el caso de uso.
