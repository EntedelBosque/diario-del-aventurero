# CODEX-002 - Implementacion del Aventurero

**Fuente:** CODEX-002 El Aventurero v1.0.0  
**Estado:** implementacion parcial aprobada  
**Ultima actualizacion:** 2026-07-21

## Decisiones implementadas

- Existe un unico jugador persistente. Su perfil inicial es Fernando, titulo
  `El Aventurero`, clase `Aventurero`, nivel 1, experiencia 0 y estado
  `activo`.
- Las estadisticas visibles son Arte, Tecnologia, Vitalidad, Social y
  Sabiduria. Arte, Tecnologia y Sabiduria son permanentes; Vitalidad y Social
  son dinamicas y requieren un periodo de gracia antes de disminuir.
- Disciplina se persiste como estadistica derivada y visible, inicia en 50 y
  se mantiene entre 0 y 100. No puede venir en una respuesta del Oraculo ni
  modificarse de forma manual.
- Las definiciones de gremios, estadisticas y progreso se almacenan en la
  base de datos para permitir ampliaciones sin reescribir el motor.
- Las relaciones incluyen afinidad, descubrimiento, ultima interaccion,
  aventuras compartidas, tiempo compartido e importancia.

## Limites pendientes

La Disciplina se recalculara una vez al dia por el Motor usando el historial
completo. CODEX-002 enumera sus factores, pero el Developer Specification aun
debe definir la formula, los pesos y las ventanas de evaluacion; por ello no
se implementa un calculo aproximado. Tambien quedan pendientes cantidades de
experiencia, duracion del periodo de gracia y umbrales de titulos.

La validacion `accepted` del Oraculo sigue significando solamente que el JSON
cumple el contrato; no que sus propuestas modifiquen el estado del jugador.
