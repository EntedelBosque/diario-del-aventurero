import { NextResponse } from "next/server";
import { getAuthenticatedUser, withSessionCookies } from "../session.ts";
import { SupabaseDiaryEntryRepository } from "../../../adapters/persistence/supabase-diary-entry-repository.ts";
import { loadOracleContextFromSupabase } from "../../../adapters/persistence/supabase-oracle-context.ts";
import { createOracleAgent } from "../../../adapters/oracle/gemini-oracle-agent.ts";
import { ProcessDiaryEntry } from "../../../core/application/process-diary-entry.ts";
import { RunMotor } from "../../../core/application/run-motor.ts";
import { SupabaseMotorRepository } from "../../../adapters/persistence/supabase-motor-repository.ts";
import { SupabaseGameBalanceRepository } from "../../../adapters/persistence/supabase-game-balance-repository.ts";
import { persistWorldEntities } from "../../../adapters/persistence/supabase-world-repository.ts";

export async function GET() {
  const session = await getAuthenticatedUser();
  if (!session.user) return withSessionCookies(NextResponse.json({ error: "Autenticación requerida" }, { status: 401 }), session.cookiesToSet);
  try {
    const pages = await new SupabaseDiaryEntryRepository().listAcceptedPages(session.user.id);
    return withSessionCookies(NextResponse.json({ pages: pages.map((page) => ({ id: page.id, occurredAt: page.occurredAt.toISOString(), title: page.title, narrative: page.narrative })) }), session.cookiesToSet);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session.user) return withSessionCookies(NextResponse.json({ error: "Autenticación requerida" }, { status: 401 }), session.cookiesToSet);
    const body = await request.json() as { text?: unknown; occurredAt?: unknown; idempotencyKey?: unknown };
    if (typeof body.text !== "string" || typeof body.occurredAt !== "string" || typeof body.idempotencyKey !== "string") return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });

    const entry = await new ProcessDiaryEntry({ diaryEntries: new SupabaseDiaryEntryRepository(), oracle: createOracleAgent(), loadOracleContext: loadOracleContextFromSupabase }).execute({ id: crypto.randomUUID(), playerId: session.user.id, idempotencyKey: body.idempotencyKey, text: body.text, occurredAt: new Date(body.occurredAt), submittedAt: new Date() });

    if (entry.oracleStatus === "accepted" && entry.worldEventId && entry.oracleResponse) {
      try {
        await persistWorldEntities(entry.playerId, entry.worldEventId, entry.occurredAt, entry.oracleResponse.entitySuggestions);
      } catch (error) {
        console.error("World entity persistence failed for entry", entry.id, error);
      }
    }

    let motorError: string | undefined;
    let rewards: { totalXp: number; guildAwards: Array<{ guildCode: string; experience: number }> } | undefined;
    if (entry.oracleStatus === "accepted" && entry.worldEventId) {
      try {
        const effects = await new RunMotor(new SupabaseMotorRepository(), new SupabaseGameBalanceRepository()).execute(entry);
        const guildTotals = new Map<string, number>();
        for (const activity of effects.activities) for (const award of activity.guildAwards) guildTotals.set(award.guildCode, (guildTotals.get(award.guildCode) ?? 0) + award.experience);
        rewards = { totalXp: effects.playerExperience, guildAwards: [...guildTotals.entries()].map(([guildCode, experience]) => ({ guildCode, experience })) };
      } catch (error) {
        motorError = error instanceof Error ? error.message : "El Motor no pudo procesar la entrada";
        console.error("Motor execution failed for entry", entry.id, error);
      }
    }

    return withSessionCookies(NextResponse.json({ id: entry.id, oracleStatus: entry.oracleStatus, title: entry.oracleResponse?.title, narrative: entry.oracleResponse?.narrative, occurredAt: entry.occurredAt.toISOString(), oracleErrors: entry.oracleErrors, motorError, rewards }), session.cookiesToSet);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error interno" }, { status: 500 });
  }
}
