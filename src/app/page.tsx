"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { formatAdventurerTimestamp } from "../shared/format-date.ts";
import { QuillIcon } from "../shared/icons/QuillIcon.tsx";
import { ShieldIcon, CompassIcon, ScrollIcon, CoinIcon } from "../shared/icons/GameIcons.tsx";

type DiaryResult = { title?: string; narrative?: string; occurredAt?: string; oracleStatus?: string; error?: string; oracleErrors?: string[]; motorError?: string; rewards?: { totalXp: number; guildAwards: Array<{ guildCode: string; experience: number }> } };

export default function DiaryPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<DiaryResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    supabase.auth.getUser().then(({ data }) => setHasSession(Boolean(data.user)));
  }, []);

  async function logout() {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setResult(null);
    try {
      const response = await fetch("/api/diary-entries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, occurredAt: new Date().toISOString(), idempotencyKey: crypto.randomUUID() }) });
      const body = await response.json() as DiaryResult;
      if (!response.ok) throw new Error(body.error ?? "No se pudo registrar la página");
      setResult(body); if (body.oracleStatus === "accepted") setText("");
    } catch (error) { setResult({ error: error instanceof Error ? error.message : "Error desconocido" }); }
    finally { setSubmitting(false); }
  }

  const timestamp = result?.occurredAt ? formatAdventurerTimestamp(new Date(result.occurredAt)) : null;
  const failed = result && (result.error || result.oracleStatus === "failed" || result.oracleStatus === "rejected");

  return <main>
    <div className="chapter-header">
      <span className="eyebrow">Páginas de lo Inexplorado</span>
      <h1 className="headline">Diario de un Aventurero</h1>
    </div>
    {hasSession
      ? <p className="session-status">Bienvenido, Aventurero — <button type="button" className="link-button" onClick={logout}>Cerrar sesión</button></p>
      : <p className="session-status"><Link href="/login">Iniciar sesión</Link></p>}
    <div className="parchment" style={{ padding: "1.5rem" }}>
      <form onSubmit={submit}>
        <label htmlFor="entry" className="entry-prompt">Relata tu aventura de hoy…</label>
        <textarea id="entry" className="journal" value={text} onChange={(event) => setText(event.target.value)} maxLength={10000} required />
        <button type="submit" className="add-button" disabled={submitting}><QuillIcon width={20} height={20} />{submitting ? "Añadiendo…" : "Añadir página"}</button>
      </form>
    </div>
    {result && (failed ? (
      <section className="result error">{result.error ?? result.oracleErrors?.join(", ") ?? `La página no pudo completarse (${result.oracleStatus}).`}</section>
    ) : (
      <article className="parchment page-card">
        {timestamp && <div className="page-timestamp">
          <span>{timestamp.dateLine}</span>
          <span>{timestamp.timeLine}</span>
          {timestamp.celestialEvent && <span className="celestial">{timestamp.celestialEvent}</span>}
        </div>}
        {result.title && <h2 className="page-title">{result.title}</h2>}
        <div className="page-divider" />
        <p className="page-narrative">{result.narrative}</p>
        {result.rewards && <>
          <div className="page-divider" />
          <div className="page-rewards">
            <span>Experiencia</span>
            <strong>+{result.rewards.totalXp} XP</strong>
            {result.rewards.guildAwards.map((award) => <span key={award.guildCode}>{award.guildCode} +{award.experience}</span>)}
          </div>
        </>}
        {result.motorError && <p className="error">Aviso: el progreso del juego no se aplicó ({result.motorError}).</p>}
      </article>
    ))}
    <nav className="bottom-nav">
      <a href="/" data-active="true"><QuillIcon width={20} height={20} />Diario</a>
      <a href="#"><ShieldIcon width={20} height={20} />Personaje</a>
      <a href="#"><CompassIcon width={20} height={20} />Mundo</a>
      <a href="#"><ScrollIcon width={20} height={20} />Misiones</a>
      <a href="#"><CoinIcon width={20} height={20} />Mercado</a>
    </nav>
  </main>;
}
