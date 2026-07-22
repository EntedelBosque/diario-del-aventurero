"use client";

import { useEffect, useState } from "react";
import { formatAdventurerTimestamp } from "../../shared/format-date.ts";
import { BottomNav } from "../BottomNav.tsx";

type Page = { id: string; title?: string; narrative: string; occurredAt: string };

export default function RelatosPage() {
  const [pages, setPages] = useState<Page[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/diary-entries")
      .then(async (response) => {
        const body = await response.json() as { pages?: Page[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "No se pudieron cargar los relatos");
        setPages(body.pages ?? []);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Error desconocido"));
  }, []);

  return <main>
    <div className="chapter-header">
      <span className="eyebrow">El libro de tus días</span>
      <h1 className="headline">Relatos</h1>
    </div>
    {error && <section className="result error">{error}</section>}
    {!error && pages === null && <p className="relatos-hint">Abriendo el códice…</p>}
    {pages !== null && pages.length === 0 && <p className="relatos-hint">Aún no has escrito ninguna página. Vuelve al Diario y relata tu primer día.</p>}
    {pages?.map((page) => {
      const timestamp = formatAdventurerTimestamp(new Date(page.occurredAt));
      return <article key={page.id} className="parchment page-card">
        <div className="page-timestamp">
          {timestamp.celestialEvent && <span className="celestial">{timestamp.celestialEvent}</span>}
          <span className="ts-date">{timestamp.dateLine}</span>
          <span className="ts-time">{timestamp.timeLine}</span>
        </div>
        {page.title && <h2 className="page-title">{page.title}</h2>}
        <div className="page-divider"><span>◆</span></div>
        <p className="page-narrative">{page.narrative}</p>
      </article>;
    })}
    <BottomNav active="relatos" />
  </main>;
}
