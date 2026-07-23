"use client";

import { useEffect, useMemo, useState } from "react";
import { formatAdventurerTimestamp, monthName } from "../../shared/format-date.ts";
import { BottomNav } from "../BottomNav.tsx";

type Page = { id: string; title?: string; narrative: string; occurredAt: string };

export default function RelatosPage() {
  const [pages, setPages] = useState<Page[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/diary-entries")
      .then(async (response) => {
        const body = await response.json() as { pages?: Page[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "No se pudieron cargar los relatos");
        setPages(body.pages ?? []);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Error desconocido"));
  }, []);

  // Árbol: Edad (año) -> Época (mes) -> páginas. Se guarda el índice para navegar la biblioteca.
  const tree = useMemo(() => {
    const byYear = new Map<number, Map<number, Page[]>>();
    for (const page of pages ?? []) {
      const date = new Date(page.occurredAt);
      const y = date.getFullYear();
      const m = date.getMonth();
      if (!byYear.has(y)) byYear.set(y, new Map());
      const months = byYear.get(y)!;
      if (!months.has(m)) months.set(m, []);
      months.get(m)!.push(page);
    }
    return byYear;
  }, [pages]);

  // Numeración global del libro: la más antigua es la Página 1.
  const pageNumbers = useMemo(() => {
    const ascending = [...(pages ?? [])].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
    const map = new Map<string, number>();
    ascending.forEach((page, index) => map.set(page.id, index + 1));
    return map;
  }, [pages]);

  const years = [...tree.keys()].sort((a, b) => b - a);
  const monthsOfYear = year !== null ? [...(tree.get(year)?.keys() ?? [])].sort((a, b) => b - a) : [];
  const pagesOfMonth = year !== null && month !== null ? (tree.get(year)?.get(month) ?? []) : [];

  return <main>
    <div className="chapter-header">
      <span className="eyebrow">📖 El libro de tus días</span>
      <h1 className="headline">Relatos</h1>
    </div>

    {error && <section className="result error">{error}</section>}
    {!error && pages === null && <p className="relatos-hint">Abriendo el códice…</p>}
    {pages !== null && pages.length === 0 && <p className="relatos-hint">Aún no has escrito ninguna página. Vuelve al Diario y relata tu primer día.</p>}

    {pages !== null && pages.length > 0 && <>
      {(year !== null) && <button type="button" className="library-back" onClick={() => (month !== null ? setMonth(null) : setYear(null))}>‹ {month !== null ? monthName(month) : `Edad ${year}`}</button>}

      {year === null && <ul className="library-list">
        {years.map((y) => <li key={y}><button type="button" className="library-item" onClick={() => setYear(y)}>
          <span className="library-roman">✦</span>
          <span className="library-title">Edad {y}</span>
          <span className="library-count">{[...(tree.get(y)?.values() ?? [])].reduce((total, list) => total + list.length, 0)} páginas</span>
        </button></li>)}
      </ul>}

      {year !== null && month === null && <ul className="library-list">
        {monthsOfYear.map((m) => <li key={m}><button type="button" className="library-item" onClick={() => setMonth(m)}>
          <span className="library-roman">❧</span>
          <span className="library-title">Época de {monthName(m)}</span>
          <span className="library-count">{tree.get(year)?.get(m)?.length ?? 0} páginas</span>
        </button></li>)}
      </ul>}

      {year !== null && month !== null && pagesOfMonth.map((page) => {
        const timestamp = formatAdventurerTimestamp(new Date(page.occurredAt));
        return <article key={page.id} className="parchment page-card">
          <div className="page-folio">📖 Página {pageNumbers.get(page.id)}</div>
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
    </>}

    <BottomNav active="relatos" />
  </main>;
}
