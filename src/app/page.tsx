"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { QuillIcon } from "../shared/icons/QuillIcon.tsx";
import { BottomNav } from "./BottomNav.tsx";
import { StatsPanel } from "./StatsPanel.tsx";
import { PageCard, type PageData, type PageGains } from "./PageCard.tsx";

type DiaryResult = { id?: string; title?: string; narrative?: string; occurredAt?: string; oracleStatus?: string; error?: string; oracleErrors?: string[]; motorError?: string; rewards?: { totalXp: number; guildAwards: Array<{ guildCode: string; experience: number }> }; gains?: PageGains };

export default function DiaryPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<DiaryResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [lastPage, setLastPage] = useState<PageData | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    supabase.auth.getUser().then(({ data }) => setHasSession(Boolean(data.user)));
  }, []);

  useEffect(() => {
    fetch("/api/diary-entries", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { pages?: PageData[] } | null) => setLastPage(body?.pages?.[0] ?? null))
      .catch(() => {});
  }, [refresh]);

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
      setResult(body); if (body.oracleStatus === "accepted") { setText(""); setRefresh((value) => value + 1); }
    } catch (error) { setResult({ error: error instanceof Error ? error.message : "Error desconocido" }); }
    finally { setSubmitting(false); }
  }

  const failed = result && (result.error || result.oracleStatus === "failed" || result.oracleStatus === "rejected");

  return <main>
    <div className="chapter-header">
      <span className="eyebrow">✒️ Páginas de lo Inexplorado</span>
      <h1 className="headline">Diario de un Aventurero</h1>
    </div>
    {hasSession
      ? <p className="session-status">Bienvenido, Aventurero — <button type="button" className="link-button" onClick={logout}>Cerrar sesión</button></p>
      : <p className="session-status"><Link href="/login">Iniciar sesión</Link></p>}
    {hasSession && <StatsPanel refreshKey={refresh} />}
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
      <>
        <PageCard page={{ id: result.id ?? "fresh", title: result.title, narrative: result.narrative ?? "", occurredAt: result.occurredAt ?? new Date().toISOString(), gains: result.gains }} />
        {result.motorError && <p className="error">Aviso: el progreso del juego no se aplicó ({result.motorError}).</p>}
      </>
    ))}
    {!result && lastPage && <>
      <p className="ultimo-relato-label">📖 Tu último relato…</p>
      <PageCard page={lastPage} />
    </>}
    <BottomNav active="diario" />
  </main>;
}
