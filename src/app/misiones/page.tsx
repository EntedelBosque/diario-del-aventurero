"use client";

import { useEffect, useState } from "react";
import { BottomNav } from "../BottomNav.tsx";

type Contract = { id: string; type: string; objective: string; state: string; difficulty: string; priority: string; categories: string[]; expiresAt: string };

const STATE_LABELS: Record<string, string> = { activo: "En curso", disponible: "Disponibles", completado: "Completadas" };
const STATE_ORDER = ["activo", "disponible", "completado"];

export default function MisionesPage() {
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/contracts")
      .then(async (response) => {
        const body = await response.json() as { contracts?: Contract[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "No se pudieron cargar las misiones");
        setContracts(body.contracts ?? []);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Error desconocido"));
  }, []);

  const groups = STATE_ORDER
    .map((state) => ({ state, items: (contracts ?? []).filter((contract) => contract.state === state) }))
    .filter((group) => group.items.length > 0);

  return <main>
    <div className="chapter-header">
      <span className="eyebrow">⚔️ Los pactos del destino</span>
      <h1 className="headline">Misiones</h1>
    </div>

    {error && <section className="result error">{error}</section>}
    {!error && contracts === null && <p className="relatos-hint">Consultando el tablón de pactos…</p>}
    {contracts !== null && contracts.length === 0 && <p className="relatos-hint">No hay misiones forjadas todavía. El Director del Juego las propondrá conforme tu historia avance.</p>}

    {groups.map((group) => <div key={group.state} className="collection-group">
      <h2>{STATE_LABELS[group.state] ?? group.state} · {group.items.length}</h2>
      <div className="collection-list">
        {group.items.map((contract) => <div key={contract.id} className="card-row">
          <span className="row-title">{contract.objective}</span>
          <span className="row-meta">{[contract.difficulty, contract.priority, contract.categories.join(", ")].filter(Boolean).join(" · ")}</span>
        </div>)}
      </div>
    </div>)}

    <BottomNav active="misiones" />
  </main>;
}
