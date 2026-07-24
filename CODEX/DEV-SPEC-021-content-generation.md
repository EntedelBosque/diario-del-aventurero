# DEV-SPEC-021 — CONTENT GENERATION ENGINE
> Motor que GENERA contenido nuevo para el mundo. Solo PROPONE. No interpreta diario, no genera
> crónicas, no toca la BD, no ejecuta cambios sobre otras entidades.

## Responsabilidad
Crea contenido usando el ESTADO ACTUAL del mundo, respetando los Codex/Biblias/Content Specification.
Nunca genera fuera de esas reglas.

## Fuentes (siempre estado vigente, nunca info desactualizada)
Estado + historial del Aventurero, Grandes Destinos, contratos/misiones/bosses activos, estadísticas,
afinidades, entidades, reinos, gremios, logros, mercado, Archivo Histórico, Archivo de Honores, config del Director.

## Genera únicamente (previamente definidos por el Content Specification)
Misiones (diarias/semanales/especiales), contratos, bosses, eventos especiales, objetos de mercado,
artefactos, logros, títulos legendarios, frases narrativas, plantillas narrativas, recompensas.

## Reglas
No duplicar contenido equivalente activo. No contradecir el estado actual ni el Archivo Histórico.
No incompatibles con Grandes Destinos, estadísticas ni la dificultad del Director.

## Propuesta (salida) — persistida, histórica, inmutable
Campos: tipo, id, contenido generado, fecha, motor generador, estado.
Estados: **Pending / Accepted / Rejected / Expired**. Solo **Accepted** se incorpora al mundo.
Regeneración: si expira/rechaza, genera una NUEVA propuesta independiente; nunca modifica una histórica.

## Integración
El **Director** solicita generaciones. El **Balance Engine** valida antes de incorporar. El **Oráculo**
y demás motores solo consumen contenido **Accepted**.

## Alcance
Define responsabilidades/entradas/salidas/estados/persistencia/integración. NO algoritmos,
probabilidades, dificultad, balance ni contenido específico → eso es del **Content Specification** + **Balance Engine**.

## Estado (Claude): PENDIENTE — es el motor de EJECUCIÓN que llena Misiones/Mercado/Logros.
## BLOQUEADO por: Content Specification (qué generar + reglas) y Balance Engine (validación/dificultad),
## docs que el Game Designer aún no entrega. Con ellos: tabla content_proposals (migración) + máquina de
## estados + generadores por tipo, disparados por el Director (018), validados por el Balance Engine.
