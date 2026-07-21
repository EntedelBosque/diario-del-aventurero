# CODEX-002 - Estadisticas derivadas

## Disciplina

Disciplina es una estadistica derivada visible dentro del perfil del jugador.
Inicia en 50 y su rango valido es de 0 a 100. El Oraculo nunca puede asignarla,
modificarla ni sugerirla.

El Motor del Juego es su unica autoridad y realiza un recalculo diario. Cada
calculo debe ser auditable: conserva valor previo y nuevo, momento, version de
reglas y detalle de los factores usados.

No se codifica una formula provisional. El Developer Specification debe definir
los pesos, ventanas temporales y la forma de evaluar frecuencia, misiones,
inactividad, Grandes Destinos, Obras Magnas, equilibrio y consistencia.
