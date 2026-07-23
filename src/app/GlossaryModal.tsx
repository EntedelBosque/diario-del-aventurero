"use client";

import { useEffect } from "react";
import { glossaryEntry } from "../shared/glossary.ts";

export function GlossaryModal({ termKey, onClose }: { termKey: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!termKey) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [termKey, onClose]);

  if (!termKey) return null;
  const entry = glossaryEntry(termKey);
  if (!entry) return null;

  return <div className="glossary-overlay" role="dialog" aria-modal="true" onClick={onClose}>
    <div className="glossary-card parchment" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="glossary-close" aria-label="Cerrar" onClick={onClose}>×</button>
      <div className="glossary-emoji" aria-hidden="true">{entry.emoji}</div>
      <h3 className="glossary-title">{entry.title}</h3>
      <div className="page-divider"><span>◆</span></div>
      <p className="glossary-body">{entry.body}</p>
      <p className="glossary-how"><span>Cómo se gana</span>{entry.howToEarn}</p>
    </div>
  </div>;
}
