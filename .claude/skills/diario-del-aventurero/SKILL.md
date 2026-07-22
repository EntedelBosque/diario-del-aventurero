---
name: diario-del-aventurero
description: >-
  Skill EXCLUSIVA del proyecto "Diario del Aventurero" (el RPG personal persistente de
  Fernando: Next.js + Supabase + Oráculo IA intercambiable). Mantiene ESE proyecto al día
  y captura su conocimiento en archivos versionados del repo, para que cualquier sesión
  futura de Claude Code arranque con contexto completo sin recargar todo el historial en el
  context window. Úsala SIEMPRE que, trabajando en Diario del Aventurero, el usuario cierre
  una sesión de trabajo, pida "actualizar el proyecto", "guardar el avance", "registrar lo que
  hicimos", "dejar constancia", anotar una decisión importante y su porqué, preparar contexto
  para retomar después, o antes de un commit grande. También cuando pregunte "¿en qué íbamos?"
  o "ponme al día": en ese caso solo LEE los archivos vivos y resume, sin escribir. NO uses
  esta skill en otros proyectos: es específica de Diario del Aventurero.
---

# Diario del Aventurero — memoria viva del proyecto

## Alcance: solo este proyecto
Esta skill pertenece exclusivamente al proyecto **Diario del Aventurero**. Se usan otras
sesiones de Claude Code para otros proyectos; allí esta skill no aplica. Antes de actuar,
confirma que la sesión actual es este repo (existe `CODEX/`, `CONTEXT.md` habla del RPG de
Fernando, `package.json` tiene `"name": "diario-del-aventurero"`). Si no lo es, no la apliques.

## Para qué existe

Diario del Aventurero se construye a lo largo de muchas sesiones cortas y con varias IAs
(ChatGPT como Game Designer, Claude como arquitecto/artesano, Gemini/Groq como Oráculo en
producción). El riesgo real no es escribir código: es **perder el hilo del *porqué*** entre
sesión y sesión, y gastar medio context window reconstruyendo lo que ya se decidió.

La solución es no confiar en la memoria de la conversación, sino en archivos canónicos dentro
del repo de Diario del Aventurero. Esta skill los mantiene actualizados con una rutina
repetible. Regla mental: *si algo importante de este proyecto solo existe en el chat, todavía
no existe.*

## Los tres archivos canónicos

La skill mantiene exactamente estos archivos en el repo de Diario del Aventurero. Si alguno
falta, créalo con el esqueleto de la sección "Plantillas" antes de escribir contenido.

| Archivo | Qué guarda | Cómo se lee |
|---|---|---|
| `CONTEXTO_ACTUAL.md` (raíz) | El *primer* compacto: estado de hoy en una pantalla. Versión, qué funciona, qué está en curso, próximos pasos, e índice de decisiones. | Es lo PRIMERO que lee una sesión nueva para ponerse al día en < 1 min. Se sobrescribe, no crece. |
| `BITACORA.md` (raíz) | Registro cronológico por sesión: qué se hizo y **por qué**. Append, entradas fechadas. | Historia narrativa. Se consulta cuando el porqué de algo no está claro. |
| `CODEX/CHANGELOG.md` (ya existe) | Cambios versionados en SemVer. | Qué cambió técnicamente por versión. Sigue el formato que ya tiene. |

`CONTEXT.md` (mayúsculas, el documento de visión grande) y los specs de `CODEX/` **no** los toca
esta skill salvo que el usuario lo pida: son la constitución del juego, no la bitácora.

## Rutina de actualización (modo escritura)

Cuando el usuario cierra sesión o pide registrar el avance en Diario del Aventurero, sigue estos
pasos. No inventes lo ocurrido: recopílalo de git y de la conversación.

### 1. Recopilar evidencia
Ejecuta y lee, en paralelo:
- `git log --oneline -15` — commits recientes.
- `git diff --stat HEAD~5..HEAD` (o desde el último registrado) — magnitud del cambio.
- `git status` — trabajo sin commitear.
- La cabecera de `CONTEXTO_ACTUAL.md` y `CODEX/CHANGELOG.md` para saber desde dónde seguir
  (última fecha/versión registrada).

### 2. Redactar el borrador y CONFIRMAR
Antes de escribir nada, presenta al usuario un borrador breve:
- **Bitácora**: 2-5 viñetas de qué se hizo esta sesión y el porqué de cada una.
- **Decisiones**: si hubo alguna decisión de arquitectura, producto o alcance, enúnciala con su
  **razón** y su **cómo aplica a futuro** (ver formato abajo).
- **Estado**: cómo queda "qué funciona / en curso / próximos pasos".
- **Versión**: si procede, propón bump SemVer y el título de la entrada de changelog.

Pregunta: *"¿Registro esto así o ajusto algo?"* Fernando es quien conoce el porqué real; no
adivines motivaciones ni las escribas como hechos si no las confirmó. Convierte fechas relativas
("ayer", "el jueves") a fecha absoluta.

### 3. Escribir los archivos
Con el visto bueno:
- **`BITACORA.md`**: añade una entrada fechada nueva ARRIBA (más reciente primero).
- **`CONTEXTO_ACTUAL.md`**: reescribe las secciones que cambiaron. Mantenlo en una pantalla — si
  crece, mueve el detalle histórico a la bitácora y deja aquí solo el estado presente. Actualiza
  el índice de decisiones.
- **`CODEX/CHANGELOG.md`**: si hay versión nueva, añade la entrada respetando el formato existente
  (`## [x.y.z] - YYYY-MM-DD` + viñetas). Sincroniza `version` en `package.json` si el usuario
  confirma el bump.

### 4. Cerrar
Resume en una o dos líneas qué archivos se tocaron y recuérdale al usuario si queda algo manual
pendiente (ej. una migración de Supabase por aplicar, un push). No hagas commit ni push salvo que
lo pida explícitamente.

## Modo lectura ("¿en qué íbamos?")

Si el usuario solo quiere ponerse al día o preguntar el estado de Diario del Aventurero, **no
escribas**. Lee `CONTEXTO_ACTUAL.md` primero; si necesita más, la entrada más reciente de
`BITACORA.md`. Resume en pocas líneas: versión, qué funciona, qué sigue. Antes de recomendar
accionar sobre algo que la bitácora menciona (un archivo, una función, un flag), verifica que siga
existiendo en el código actual — la bitácora es una foto del momento en que se escribió, no la
verdad presente.

## Qué merece guardarse (y qué no)

Guarda lo que **no** se puede reconstruir leyendo el código o `git log`:
- El *porqué* de una decisión (restricción, costo, incidente, preferencia de Fernando).
- Alcance excluido a propósito y la razón (ej. "no se calcula el equinoccio astronómico exacto; se
  usan fechas fijas aproximadas porque para uso personal basta").
- Trabajo manual pendiente fuera del repo (migraciones aplicadas a mano en Supabase, billing por
  activar, pruebas desde el iPhone).
- Quién hace qué entre las IAs y hacia dónde va el siguiente lote.

No guardes lo derivable del repo: estructura de carpetas, qué hace una función, convenciones de
código, o el historial de commits en sí. Si el usuario pide guardar algo derivable, pregunta qué
fue *sorprendente o no obvio* de eso — esa es la parte que vale.

## Formato de una decisión

En `CONTEXTO_ACTUAL.md` (índice) y, si es sustancial, expandida en la bitácora:

```
### Decisión: <enunciado corto>
- **Por qué:** <la razón real — costo, incidente, restricción, preferencia>
- **Cómo aplica:** <cuándo y dónde debe influir esta decisión a futuro>
- **Fecha:** YYYY-MM-DD
```

Ejemplo real del proyecto:
```
### Decisión: Groq como Oráculo por defecto, no Gemini
- **Por qué:** free tier viable sin billing y contrato de prompt compartible; se mantiene el
  principio de proveedor intercambiable (callAgent abstracto).
- **Cómo aplica:** al tocar adaptadores de Oráculo, no acoplar lógica a un proveedor; cualquiera
  debe cumplir el mismo contrato JSON.
- **Fecha:** 2026-07-22
```

## Plantillas (esqueleto si el archivo no existe)

### CONTEXTO_ACTUAL.md
```markdown
# Contexto Actual — Diario de un Aventurero
> Primer compacto para retomar el proyecto. Léelo antes que nada.
> Última actualización: YYYY-MM-DD · Versión: x.y.z

## En una línea
<qué es el proyecto, una frase>

## Qué funciona hoy
- <feature operativa>

## En curso
- <lo que se está construyendo ahora>

## Próximos pasos
1. <siguiente acción concreta>

## Pendientes manuales (fuera del repo)
- <migraciones a aplicar, billing, pruebas en dispositivo, etc.>

## Índice de decisiones clave
- <enunciado> (YYYY-MM-DD) — ver BITACORA.md
```

### BITACORA.md
```markdown
# Bitácora — Diario de un Aventurero
> Registro cronológico por sesión (más reciente arriba). El *qué* y sobre todo el *porqué*.

## YYYY-MM-DD — <título de la sesión>
- <qué se hizo> — **porqué:** <razón>

### Decisión: <si hubo alguna>
- **Por qué:** ...
- **Cómo aplica:** ...
- **Fecha:** YYYY-MM-DD
```

## Comprobación final
Antes de dar por cerrada la actualización: ¿un desarrollador (o una IA) que abra solo
`CONTEXTO_ACTUAL.md` mañana entiende en qué punto está Diario del Aventurero y qué sigue, sin leer
el chat? Si no, ajusta ese archivo hasta que sí.
