"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "../BottomNav.tsx";
import { GlossaryModal } from "../GlossaryModal.tsx";
import { formatAdventurerTimestamp } from "../../shared/format-date.ts";
import { OFFICIAL_GUILD_CODES } from "../../core/domain/guilds.ts";
import { guildName } from "../../shared/guilds.ts";
import { guildTier } from "../../shared/guild-tiers.ts";
import { glossaryEntry } from "../../shared/glossary.ts";

type Entity = { id: string; type: string; name: string; alias: string | null; aliases: string[]; category: string | null; description: string | null; discoveredAt: string };
type Guild = { code: string; mastery: number };

const TYPE_LABELS: Record<string, string> = {
  personaje: "Personajes", lugar: "Lugares", conocimiento: "Conocimientos",
  herramienta: "Herramientas", objeto: "Objetos", organizacion: "Reinos y Órdenes"
};
const TYPE_ORDER = ["personaje", "lugar", "conocimiento", "herramienta", "objeto", "organizacion"];

export default function MundoPage() {
  const [entities, setEntities] = useState<Entity[] | null>(null);
  const [guilds, setGuilds] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Entity | null>(null);
  const [term, setTerm] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/world")
      .then(async (response) => {
        const body = await response.json() as { entities?: Entity[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "No se pudo cargar el mundo");
        setEntities(body.entities ?? []);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Error desconocido"));
    fetch("/api/player")
      .then((response) => (response.ok ? response.json() : null))
      .then((summary: { guilds?: Guild[] } | null) => {
        const map: Record<string, number> = {};
        for (const guild of summary?.guilds ?? []) map[guild.code] = guild.mastery;
        setGuilds(map);
      })
      .catch(() => {});
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

    <div className="collection-group">
      <h2>⚜️ Gremios · Afinidad</h2>
      <div className="collection-list">
        {OFFICIAL_GUILD_CODES.map((code) => {
          const mastery = guilds[code] ?? 0;
          const tier = guildTier(mastery);
          const status = tier.joined ? (tier.tierName ? `Miembro · ${tier.tierName}` : "Miembro") : `Faltan ${tier.nextAt - mastery} para unirte`;
          return <button key={code} type="button" className={`affinity-row${tier.joined ? " joined" : ""}`} onClick={() => setTerm(code)}>
            <span className="affinity-emoji" aria-hidden="true">{glossaryEntry(code)?.emoji ?? "⚜️"}</span>
            <span className="affinity-body">
              <span className="affinity-name">{guildName(code)}</span>
              <span className="affinity-status">{status}</span>
              <span className="affinity-bar"><span style={{ width: `${Math.min(100, Math.round((mastery / tier.nextAt) * 100))}%` }} /></span>
            </span>
            <span className="affinity-points">{mastery}</span>
          </button>;
        })}
      </div>
    </div>

    {error && <section className="result error">{error}</section>}
    {!error && entities === null && <p className="relatos-hint">Desplegando el mapa…</p>}
    {entities !== null && entities.length === 0 && <p className="relatos-hint">El mundo aún está por descubrirse. Cada persona, lugar o saber que menciones en tu diario quedará grabado aquí.</p>}

    {groups.map((group) => <div key={group.type} className="collection-group">
      <h2>{TYPE_LABELS[group.type] ?? group.type} · {group.items.length}</h2>
      <div className="collection-list">
        {group.items.map((entity) => <button key={entity.id} type="button" className="card-row" onClick={() => setSelected(entity)}>
          <span className="row-title">{entity.name}</span>
          {entity.alias && <span className="row-alias">«{entity.alias}»</span>}
          {entity.category && <span className="row-meta">{entity.category}</span>}
        </button>)}
      </div>
    </div>)}

    {selected && <div className="glossary-overlay" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
      <div className="glossary-card parchment" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="glossary-close" aria-label="Cerrar" onClick={() => setSelected(null)}>×</button>
        <h3 className="glossary-title">{selected.name}</h3>
        {selected.alias && <p className="entity-alias">«{selected.alias}»</p>}
        <div className="page-divider"><span>◆</span></div>
        <p className="glossary-body">{selected.description ?? "Aún no hay una semblanza. Se irá escribiendo conforme lo menciones en tus relatos."}</p>
        <p className="glossary-how"><span>Primera aparición</span>{formatAdventurerTimestamp(new Date(selected.discoveredAt)).dateLine}</p>
        {selected.category && <p className="entity-tag">{TYPE_LABELS[selected.type] ?? selected.type} · {selected.category}</p>}
      </div>
    </div>}

    <GlossaryModal termKey={term} onClose={() => setTerm(null)} />
    <BottomNav active="mundo" />
  </main>;
}
