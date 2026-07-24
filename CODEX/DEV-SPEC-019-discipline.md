# DEV-SPEC-019 — THE DISCIPLINE SYSTEM

> "El acero no se forja en un solo golpe, sino en la constancia de miles de martillazos."
> La Disciplina no premia escribir mucho; premia **regresar** al camino. La constancia construye la leyenda.

## Qué mide
Solo **consistencia** (no talento, inteligencia ni éxito).

## Reglas
- Estadística **derivada**, visible. El Oráculo NUNCA la modifica; solo el Motor de Progresión.
- Rango 0–100. Inicial 50. Nunca >100 ni <0.

## Fase 1 (IMPLEMENTADA ✅)
- Cada crónica registrada correctamente: **+1** (máx 100). Sin reducción automática.
- Permite mostrar la estadística desde el inicio sin bloquear el desarrollo.

## Fase 2 (futura — requiere Motor de Tiempo)
Recalculo diario con los últimos 30 días.
- Positivos: crónicas, contratos/misiones (diarias/semanales) completadas, progreso en Grandes
  Destinos y Obras Magnas, equilibrio entre gremios, consistencia semanal.
- Negativos: días inactivos, contratos expirados, abandono de Grandes Destinos, periodos sin
  escribir, desequilibrio extremo entre gremios.
- **Decay** solo por proceso programado diario; gradual, nunca punitivo, jamás durante el registro.

## Interpretación (solo descriptiva) — IMPLEMENTADA ✅
90–100 Legendaria · 75–89 Ejemplar · 60–74 Constante · 40–59 Variable · 20–39 Inestable · 0–19 Descuidada.

## Diseño (UI)
Mostrar: valor actual ✅, variación reciente ⏳, historial ⏳, motivo del último cambio ⏳.
"Nunca un número sin explicación." (Rango ya mostrado; variación/historial llegan con el Motor de Tiempo
o con lectura de `stat_history`.)

## Estado (Claude)
- ✅ Fase 1 (+1/crónica, tope 100) y rango interpretativo en la UI.
- ⏳ Fase 2 (recalculo 30 días + decay) requiere el Motor de Tiempo (job programado). Ver también la
  idea de notificaciones (job diario) — comparten infraestructura de tareas programadas.
