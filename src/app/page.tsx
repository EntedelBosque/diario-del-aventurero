"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { QuillIcon } from "../shared/icons/QuillIcon.tsx";

type DiaryResult = { narrative?: string; oracleStatus?: string; error?: string; oracleErrors?: string[]; motorError?: string };

export default function DiaryPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<DiaryResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    supabase.auth.getUser().then(({ data }) => setSessionEmail(data.user?.email ?? null));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setResult(null);
    try {
      const response = await fetch("/api/diary-entries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, occurredAt: new Date().toISOString(), idempotencyKey: crypto.randomUUID() }) });
      const body = await response.json() as DiaryResult;
      if (!response.ok) throw new Error(body.error ?? "No se pudo registrar la entrada");
      setResult(body); if (body.oracleStatus === "accepted") setText("");
    } catch (error) { setResult({ error: error instanceof Error ? error.message : "Error desconocido" }); }
    finally { setSubmitting(false); }
  }

  async function logout() {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return <main>
    <div className="chapter-header">
      <span className="eyebrow">Crónicas de lo Inexplorado</span>
      <h1 className="headline">Diario de un Aventurero</h1>
    </div>
    {sessionEmail ? <p className="session-status">Sesión activa: {sessionEmail} — <button type="button" className="link-button" onClick={logout}>Cerrar sesión</button></p> : <p><Link href="/login">Iniciar sesión</Link></p>}
    <div className="parchment" style={{ padding: "1.5rem" }}>
      <form onSubmit={submit}>
        <label htmlFor="entry" className="headline" style={{ fontSize: "1rem" }}>¿Qué ocurrió?</label>
        <textarea id="entry" className="journal" value={text} onChange={(event) => setText(event.target.value)} maxLength={10000} required />
        <button type="submit" className="seal-button" disabled={submitting}><QuillIcon width={28} height={28} />{submitting ? "Registrando…" : "Sellar Destino"}</button>
      </form>
    </div>
    {result && <section className={`result ${result.error || result.oracleStatus === "failed" || result.oracleStatus === "rejected" ? "error" : ""}`}>{result.error ?? result.narrative ?? result.oracleErrors?.join(", ") ?? `Entrada ${result.oracleStatus}.`}{result.motorError && <p className="error">Aviso: el progreso del juego no se aplicó ({result.motorError}).</p>}</section>}
    <nav className="bottom-nav">
      <a href="/" data-active="true">Diario</a>
      <a href="#">Personaje</a>
      <a href="#">Mundo</a>
      <a href="#">Misiones</a>
      <a href="#">Mercado</a>
    </nav>
  </main>;
}
