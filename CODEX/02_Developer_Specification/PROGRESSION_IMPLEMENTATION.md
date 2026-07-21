# CODEX-003 - Implementacion de progresion

**Fuente:** CODEX-003 Sistema de Progresion v1.0.0  
**Estado:** implementacion parcial aprobada  
**Ultima actualizacion:** 2026-07-21

## Motor implementado

El Motor calcula XP de una actividad valida de forma determinista:

`XP = Base + Tiempo + Personas + Descubrimiento + Bonificaciones`

Usa los valores iniciales recomendados por CODEX-003. El tramo de tiempo se
interpreta como limite superior inclusivo: 30 minutos reciben +5, 60 reciben
+10, 120 reciben +20 y 240 reciben +35. Todo valor superior recibe +50.

La experiencia total no disminuye. El nivel se calcula por umbrales totales:
para pasar desde el nivel `n`, se requieren `ceil(100 * n^1.5)` XP acumulados.
No hay nivel maximo.

## Datos requeridos antes del calculo

Una actividad debe incluir escala, duracion, al menos una clasificacion y sus
pesos. Los pesos suman 100. El Oraculo puede proponer datos, pero el Motor
recibe las decisiones enriquecidas: solo la base de datos determina si un
descubrimiento es el primero, la importancia de una persona y si hay duplicado.
Al distribuir XP hacia gremios, todo el total se conserva: los residuos por
redondeo se asignan primero a la mayor fraccion y, en empate, al primer gremio
declarado por la actividad.

## Limites pendientes

CODEX-003 no fija conversion de XP a aumento de estadistica, formula de nivel,
rango o maestria de gremio, reduccion por duplicados, ni multiplicadores
concretos. El Motor registra la clasificacion y las partes del calculo, pero no
inventara esas reglas ni modificara estadisticas hasta que esten especificadas.
