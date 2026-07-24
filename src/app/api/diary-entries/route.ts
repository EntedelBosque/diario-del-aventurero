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
import { incrementPlayerStats, allocateStatGains, bumpDiscipline } from "../../../adapters/persistence/supabase-player-repository.ts";
import { calculateExperience } from "../../../core/domain/progression.ts";
import type { OracleResponse } from "../../../core/domain/oracle-response.ts";

function computePageGains(response: OracleResponse) {
  const activities: Array<{ totalXp: number; classifications: Array<{ stat: string; weight: number }> }> = [];
  let xp = 0;
  for (const activity of response.activities) {
    try {
      const totalXp = calculateExperience({ scale: activity.scale, durationMinutes: activity.durationMinutes, classifications: activity.classifications, discoveries: [], participants: [], bonusXp: 0 }).totalXp;
      xp += totalXp;
      activities.push({ totalXp, classifications: activity.classifications });
    } catch { /* actividad inválida: se omite */ }
  }
  const statDeltas = allocateStatGains(activities);
  return {
    xp, coins: xp,
    stats: Object.entries(statDeltas).map(([key, delta]) => ({ key, delta })),
    discoveries: response.entitySuggestions.map((entity) => entity.alias ?? entity.name),
    missions: response.contractEvidence.length,
    bosses: response.bossEvidence.length
  };
}

export async function GET() {
  const session = await getAuthenticatedUser();
  if (!session.user) return withSessionCookies(NextResponse.json({ error: "Autenticación requerida" }, { status: 401 }), session.cookiesToSet);
  try {
    const pages = await new SupabaseDiaryEntryRepository().listAcceptedPages(session.user.id);
    return withSessionCookies(NextResponse.json({ pages: pages.map((page) => ({ id: page.id, occurredAt: page.occurredAt.toISOString(), title: page.response.title, narrative: page.response.narrative, gains: computePageGains(page.response) })) }), session.cookiesToSet);
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
        try {
          const statDeltas = allocateStatGains(effects.activities.map((activity) => ({ totalXp: activity.totalXp, classifications: activity.classifications as Array<{ stat: string; weight: number }> })));
          await incrementPlayerStats(entry.playerId, statDeltas);
          await bumpDiscipline(entry.playerId, 1);
        } catch (error) {
          console.error("Player stat increment failed for entry", entry.id, error);
        }
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
