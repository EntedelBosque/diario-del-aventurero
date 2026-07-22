"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

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

  return <main><h1>Diario de un Aventurero</h1><p>Registra un hecho. La crónica nunca reemplaza lo que viviste.</p><p><Link href="/login">Iniciar sesión</Link></p>{sessionEmail && <p className="session-status">Sesión activa: {sessionEmail}</p>}<form onSubmit={submit}><label htmlFor="entry">¿Qué ocurrió?</label><textarea id="entry" value={text} onChange={(event) => setText(event.target.value)} maxLength={10000} required /><button disabled={submitting}>{submitting ? "Registrando…" : "Registrar"}</button></form>{result && <section className={`result ${result.error || result.oracleStatus === "failed" || result.oracleStatus === "rejected" ? "error" : ""}`}>{result.error ?? result.narrative ?? result.oracleErrors?.join(", ") ?? `Entrada ${result.oracleStatus}.`}{result.motorError && <p className="error">Aviso: el progreso del juego no se aplicó ({result.motorError}).</p>}</section>}</main>;
}
