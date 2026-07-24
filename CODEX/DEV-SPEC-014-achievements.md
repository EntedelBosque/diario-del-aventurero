# DEV-SPEC-014 — ACHIEVEMENT SYSTEM
> Solo estructura de los Logros. NO define desbloqueo, recompensas ni balance (docs aparte).

Un **Logro** = hito permanente. Al desbloquearse **nunca** se elimina ni se re-bloquea.

## Estructura (mínimo)
id único · nombre · descripción · **rareza** · **categoría** · fecha de desbloqueo · estado ·
imagen/ilustración · frase narrativa del Oráculo.

## Estado
Solo dos: **Bloqueado** / **Desbloqueado**. Sin estados intermedios.

## Rarezas (solo clasificación visual, no cambian mecánicas)
Común · Extraño · Heroico · Legendario · Mítico · Único.

## Categorías (exactamente una por logro; lista ampliable)
Exploración, Arte, Tecnología, Social, Vitalidad, Grandes Destinos, Gremios, Jefes, Colección, Especial.

## Colecciones (agrupación temática; no altera el logro)
Ej.: La Biblioteca del Cronista, Los Grandes Viajes, Maestros del Acero, El Bosque Interior.
Cada colección guarda: nombre, descripción, nº total, nº desbloqueados.

## Persistencia
Un logro desbloqueado permanece para siempre. Nunca se elimina, reinicia ni pierde.

## Alcance
Define estructura/estados/rarezas/categorías/colecciones/persistencia. NO condiciones de desbloqueo,
recompensas, generación automática ni progresión.

## Estado (Claude): PENDIENTE. Requiere migración (rareza/categoría/ilustración/frase + tabla colecciones)
## y un catálogo. Las condiciones de desbloqueo dependen de otro doc + del Director (018).
