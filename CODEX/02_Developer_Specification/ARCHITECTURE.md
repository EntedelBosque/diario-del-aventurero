# CODEX-ARCH-001 - Arquitectura base

**Estado:** aprobado para la fase de estructura  
**Ultima actualizacion:** 2026-07-21

## Decision

El MVP sera una aplicacion unica de Next.js con TypeScript estricto. No habra microservicios, una segunda API ni un backend duplicado. Next aporta la PWA y los endpoints; Supabase aporta PostgreSQL, autenticacion y persistencia.

El codigo se organiza en capas con dependencias hacia el interior:

```text
PWA / route handlers
        ↓
casos de uso (application)
        ↓
dominio y motor de reglas (core)
        ↑
puertos (interfaces)
        ↑
adaptadores: Supabase, Gemini u otro proveedor
```

## Responsabilidades y limites

| Componente | Responsabilidad | No puede hacer |
| --- | --- | --- |
| `src/app` | Pantallas, PWA y rutas HTTP | Decidir reglas RPG o escribir SQL de negocio |
| `src/core/domain` | Entidades, eventos y reglas deterministas | Importar Next, React, Supabase o SDKs de IA |
| `src/core/application` | Orquestar comandos y transacciones | Contener detalles de un proveedor |
| `src/core/ports` | Contratos de persistencia, reloj y Oraculo | Implementar infraestructura |
| `src/adapters` | Implementar puertos externos | Alterar el estado sin pasar por un caso de uso |
| `supabase/migrations` | Esquema versionado de PostgreSQL | Contener reglas de negocio de la app |

## Flujo de una entrada

1. El jugador envia una entrada de diario.
2. El caso de uso guarda el texto original como un hecho inmutable.
3. Se carga solo el contexto relevante mediante un puerto de repositorio.
4. El Oraculo devuelve una **propuesta JSON**, nunca una mutacion directa.
5. El motor valida la propuesta contra las reglas del Codex y calcula el cambio de estado de forma determinista.
6. Una transaccion persiste eventos y proyecciones. La interfaz muestra esa consecuencia junto con la narrativa.

Si el Oraculo falla, el hecho original permanece guardado y puede procesarse de nuevo. La narrativa no bloquea el diario.

## Modelo de persistencia

`world_events` sera el registro cronologico autoritativo y append-only. Las tablas de lectura (`players`, `stats`, `characters`, `quests`, `bosses`, etc.) son proyecciones regenerables. Cada mutacion debera guardar su origen, version de reglas y fecha; por tanto, el mundo se puede auditar y reconstruir.

La base de datos es la memoria persistente. Los prompts solo incluyen una vista minima, temporal y relevante de ella.

## Contratos de fiabilidad

- Los comandos que cambian estado requieren una `idempotencyKey` unica.
- Las actualizaciones de un comando usan una sola transaccion.
- El motor recibe entradas tipadas y devuelve eventos tipados; no acepta JSON libre sin validacion.
- Los calculos usan enteros para XP, monedas y dano; nunca `float`.
- Todo evento contiene `schemaVersion` y `rulesVersion`.
- Los secretos viven solo en `.env.local`; jamas en codigo ni commits.
- La IA se invoca exclusivamente a traves de `OracleAgent`.

## Estructura de carpetas

```text
src/
  app/                 # PWA, paginas y route handlers de Next
  core/
    domain/            # modelo y motor puro
    application/       # casos de uso
    ports/             # interfaces hacia el exterior
  adapters/
    persistence/       # Supabase/Postgres
    oracle/             # Gemini y futuros proveedores
  features/             # composicion de UI por capacidad
  shared/               # utilidades sin reglas de juego
supabase/migrations/   # DDL versionado
tests/
  unit/                # motor y casos de uso
  integration/         # adaptadores y transacciones
```

## Decisiones diferidas

No se elige todavia biblioteca de UI, autenticacion final, SDK de Supabase ni proveedor concreto de IA. Esas elecciones se haran al implementar el primer vertical slice, conservando estos puertos.
