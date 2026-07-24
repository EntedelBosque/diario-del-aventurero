# DEV-SPEC-013 — THE LIVING WORLD

> "Todo reino cambia. Todo viajero evoluciona. Toda historia continúa."
> Spec del Game Designer. Fuente de verdad para la evolución del mundo.

## Principio
El mundo nunca es estático. Cada persona, reino, sendero, gremio, herramienta, objeto,
conocimiento o destino descubierto forma parte de un **mundo vivo** que evoluciona con el Aventurero.
El Oráculo no memoriza solo hechos: **preserva la historia**.

## Entidades
Todo lo que el Aventurero descubre y puede reaparecer es una **Entidad persistente**: persona, reino
de trabajo, gremio, herramienta, ciudad, refugio, proyecto, obra magna, gran destino, conocimiento,
objeto importante.

## Memoria del mundo (inmutable)
- Ninguna entidad se elimina. El tiempo no borra la historia (tablas append-only + `entity_history`).
- Cada entidad conserva **todas sus etapas**. Ej.: Fernando · Reino de Trabajo: 2024 XalDigital →
  2026 Bizee → … El reino anterior permanece como Archivo Histórico.

## Los Reinos cambian
Los Reinos = etapas profesionales. Nunca se sobrescriben ni destruyen. Cuando el Aventurero narre
suficientes hechos de un nuevo Reino, el Director propone actualizar el **Reino activo**; los
anteriores pasan al Archivo Histórico.

## Los caminos (relaciones) evolucionan
Una relación nunca desaparece; solo cambia de naturaleza. Ej.: Compañera del Refugio → Aliada →
Confidente → Compañera de Vida. Cada etapa queda registrada.

## Títulos Legendarios
Toda persona tiene **Identidad Real** (profesión, relación, estado) y **Identidad Legendaria** (título).
- Los títulos JAMÁS son comunes. **Prohibidos:** Roomie, Amigo, Jefe, Novia, Compañero, Cliente.
- El Director los transforma en épicos según la esencia. Ej.: "La Custodia del Refugio Eterno",
  "El Forjador del Acero Digital", "La Artesana del Pan Dorado", "El Guardián del Archivo".

## Evolución de títulos (Archivo de Honores)
Al subir la Afinidad, el Director puede otorgar un **nuevo** título sin reemplazar el anterior:
el previo se guarda en el **Archivo de Honores**; solo uno queda como **Título Vigente**.

## La verdad del mundo
Antes de cada crónica, el Oráculo consulta la Memoria del Mundo. Nunca usa info archivada como si
siguiera vigente: narra el **Reino actual**, el **Título vigente**, el **estado actual** del sendero.

## La historia nunca se reescribe
El mundo no corrige el pasado, lo preserva. Cada etapa es una **Era** distinta de la leyenda. El
Oráculo jamás altera una crónica antigua: solo escribe el siguiente capítulo.

---

## Estado de implementación (Claude)
- ✅ Entidades persistentes + memoria append-only (world_entities, entity_history, trigger anti-borrado).
- ✅ Semblanza y alias **evolucionan** al re-mencionar (se conserva el descubrimiento).
- ✅ Afinidad por menciones (reputación) con rango épico.
- ✅ Oráculo **consulta la verdad actual**: el contexto ya incluye título vigente + semblanza por
  entidad (ordenadas por afinidad); el prompt le exige respetarla y no contradecir (corrige, ej. Bizee).
- ✅ **Títulos legendarios** obligatorios; prohibidos roomie/amigo/jefe/novia/cliente.
- ⏳ Pendiente: **Reino activo vs Archivo Histórico** (concepto de Era), **Archivo de Honores** de
  títulos con historial explícito, **evolución de relaciones** con etapas nombradas, propuestas del
  Director para actualizar Reino activo. (Requiere modelar "estado vigente vs histórico" por entidad.)
