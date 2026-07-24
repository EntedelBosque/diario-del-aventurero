import { formatAdventurerTimestamp } from "../shared/format-date.ts";
import { glossaryEntry } from "../shared/glossary.ts";
import { guildName } from "../shared/guilds.ts";

export type PageGains = {
  xp: number;
  coins: number;
  discipline?: number;
  stats: Array<{ key: string; delta: number }>;
  guilds?: Array<{ guildCode: string; experience: number }>;
  discoveries: string[];
  missions: number;
  bosses: number;
};

export type PageData = { id: string; title?: string; narrative: string; occurredAt: string; gains?: PageGains };

export function PageCard({ page, folio }: { page: PageData; folio?: number }) {
  const timestamp = formatAdventurerTimestamp(new Date(page.occurredAt));
  const gains = page.gains;
  const hasGains = gains && (gains.xp > 0 || gains.stats.length > 0 || gains.discoveries.length > 0 || gains.missions > 0 || gains.bosses > 0 || (gains.guilds?.length ?? 0) > 0 || (gains.discipline ?? 0) > 0);

  return <article className="parchment page-card">
    {folio !== undefined && <div className="page-folio">📖 Página {folio}</div>}
    <div className="page-timestamp">
      {timestamp.celestialEvent && <span className="celestial">{timestamp.celestialEvent}</span>}
      <span className="ts-date">{timestamp.dateLine}</span>
      <span className="ts-time">{timestamp.timeLine}</span>
    </div>
    {page.title && <h2 className="page-title">{page.title}</h2>}
    <div className="page-divider"><span>◆</span></div>
    <p className="page-narrative">{page.narrative}</p>
    {hasGains && <>
      <div className="page-divider"><span>◆</span></div>
      <div className="page-gains-label">En este relato</div>
      <div className="page-gains">
        {gains.xp > 0 && <span className="gain">✨ +{gains.xp} XP</span>}
        {gains.coins > 0 && <span className="gain gold">🟡 +{gains.coins} oro</span>}
        {(gains.discipline ?? 0) > 0 && <span className="gain">🔥 Disciplina +{gains.discipline}</span>}
        {gains.stats.map((stat) => <span key={stat.key} className="gain">{glossaryEntry(stat.key)?.emoji ?? "✦"} {glossaryEntry(stat.key)?.title ?? stat.key} +{stat.delta}</span>)}
        {(gains.guilds ?? []).map((guild) => <span key={guild.guildCode} className="gain">⚜️ {guildName(guild.guildCode)} +{guild.experience}</span>)}
        {gains.discoveries.length > 0 && <span className="gain">🗺️ {gains.discoveries.join(", ")}</span>}
        {gains.missions > 0 && <span className="gain">⚔️ {gains.missions} {gains.missions === 1 ? "misión" : "misiones"}</span>}
        {gains.bosses > 0 && <span className="gain">🐉 {gains.bosses} boss</span>}
      </div>
    </>}
  </article>;
}
