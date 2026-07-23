"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "../BottomNav.tsx";

type Entity = { id: string; type: string; name: string; aliases: string[]; category: string | null };

const TYPE_LABELS: Record<string, string> = {
  personaje: "Personajes",
  lugar: "Lugares",
  conocimiento: "Conocimientos",
  herramienta: "Herramientas",
  objeto: "Objetos",
  organizacion: "Reinos y Órdenes"
};
const TYPE_ORDER = ["personaje", "lugar", "conocimiento", "herramienta", "objeto", "organizacion"];

export default function MundoPage() {
  const [entities, setEntities] = useState<Entity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/world")
      .then(async (response) => {
        const body = await response.json() as { entities?: Entity[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "No se pudo cargar el mundo");
        setEntities(body.entities ?? []);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Error desconocido"));
  }, []);

  const groups = useMemo(() => {
    const byType = new Map<string, Entity[]>();
    for (const entity of entities ?? []) {
      if (!byType.has(entity.type)) byType.set(entity.type, []);
      byType.get(entity.type)!.push(entity);
    }
    return [...byType.keys()].sort((a, b) => (TYPE_ORDER.indexOf(a) + 99) - (TYPE_ORDER.indexOf(b) + 99)).map((type) => ({ type, items: byType.get(type)! }));
  }, [entities]);

  return <main>
    <div className="chapter-header">
      <span className="eyebrow">🗺️ La memoria del reino</span>
      <h1 className="headline">Mundo</h1>
    </div>

    {error && <section className="result error">{error}</section>}
    {!error && entities === null && <p className="relatos-hint">Desplegando el mapa…</p>}
    {entities !== null && entities.length === 0 && <p className="relatos-hint">El mundo aún está por descubrirse. Cada persona, lugar o saber que menciones en tu diario quedará registrado aquí.</p>}

    {groups.map((group) => <div key={group.type} className="collection-group">
      <h2>{TYPE_LABELS[group.type] ?? group.type} · {group.items.length}</h2>
      <div className="collection-list">
        {group.items.map((entity) => <div key={entity.id} className="card-row">
          <span className="row-title">{entity.name}</span>
          {(entity.category || entity.aliases.length > 0) && <span className="row-meta">{[entity.category, entity.aliases.join(", ")].filter(Boolean).join(" · ")}</span>}
        </div>)}
      </div>
    </div>)}

    <BottomNav active="mundo" />
  </main>;
}
