"use client";

import { useEffect, useState } from "react";
import { BottomNav } from "../BottomNav.tsx";

type Reward = { id: string; name: string; description: string; cost: number; category: string };
type Market = { balance: number; rewards: Reward[] };

export default function MercadoPage() {
  const [market, setMarket] = useState<Market | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/market")
      .then(async (response) => {
        const body = await response.json() as (Market & { error?: string });
        if (!response.ok) throw new Error(body.error ?? "No se pudo cargar el mercado");
        setMarket({ balance: body.balance ?? 0, rewards: body.rewards ?? [] });
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Error desconocido"));
  }, []);

  return <main>
    <div className="chapter-header">
      <span className="eyebrow">El bazar del reino</span>
      <h1 className="headline">Mercado</h1>
    </div>

    {error && <section className="result error">{error}</section>}
    {!error && market === null && <p className="relatos-hint">Abriendo las puertas del bazar…</p>}

    {market && <>
      <div className="wallet parchment">
        <span className="coins">{market.balance.toLocaleString("es-MX")}</span>
        <span className="coins-label">Monedas del Aventurero</span>
      </div>
      {market.rewards.length === 0
        ? <p className="relatos-hint">El bazar aún no ofrece recompensas. Aquí podrás canjear tus monedas por premios reales cuando los definas.</p>
        : <div className="collection-list">
            {market.rewards.map((reward) => <div key={reward.id} className="card-row">
              <span className="row-title">{reward.name}</span>
              <span className="row-meta">{reward.description}</span>
              <span className="reward-cost">{reward.cost.toLocaleString("es-MX")} monedas</span>
            </div>)}
          </div>}
    </>}

    <BottomNav active="mercado" />
  </main>;
}
