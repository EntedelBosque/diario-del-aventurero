"use client";

import { useEffect, useState } from "react";
import { guildName } from "../shared/guilds.ts";
import { GlossaryModal } from "./GlossaryModal.tsx";

type Stat = { key: string; label: string; value: number };
type Guild = { code: string; mastery: number };
type Summary = { displayName: string; characterClass: string; title: string; level: number; experience: number; stats: Stat[]; guilds: Guild[] };

export function StatsPanel() {
  const [data, setData] = useState<Summary | null>(null);
  const [term, setTerm] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/player")
      .then((response) => (response.ok ? response.json() : null))
      .then((summary) => setData(summary as Summary | null))
      .catch(() => {});
  }, []);

  if (!data) return null;

  return <section className="stats-panel parchment">
    <div className="stats-head">
      <div className="stats-identity">
        <span className="stats-name">{data.displayName}</span>
        <span className="stats-class">{data.title || data.characterClass}</span>
      </div>
      <div className="stats-level">
        <span>Nivel</span>
        <strong>{data.level}</strong>
      </div>
    </div>
    <div className="stats-xp">{data.experience.toLocaleString("es-MX")} XP acumulada</div>
    <div className="stats-grid">
      {data.stats.map((stat) => <button key={stat.key} type="button" className="stat-tile" onClick={() => setTerm(stat.key)}>
        <span className="stat-label">{stat.label}</span>
        <span className="stat-value">{stat.value.toLocaleString("es-MX")}</span>
        {stat.key === "disciplina" && <div className="stat-bar"><div style={{ width: `${Math.max(0, Math.min(100, stat.value))}%` }} /></div>}
      </button>)}
    </div>
    {data.guilds.length > 0 && <div className="stats-guilds">
      {data.guilds.map((guild) => <button key={guild.code} type="button" className="guild-chip" onClick={() => setTerm(guild.code)}>{guildName(guild.code)}<em>{guild.mastery.toLocaleString("es-MX")}</em></button>)}
    </div>}
    <GlossaryModal termKey={term} onClose={() => setTerm(null)} />
  </section>;
}
