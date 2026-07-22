import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SupabaseDiaryEntryRepository } from "../../../adapters/persistence/supabase-diary-entry-repository.ts";
import { loadOracleContextFromSupabase } from "../../../adapters/persistence/supabase-oracle-context.ts";
import { createOracleAgent } from "../../../adapters/oracle/gemini-oracle-agent.ts";
import { ProcessDiaryEntry } from "../../../core/application/process-diary-entry.ts";

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session.user) return withSessionCookies(NextResponse.json({ error: "Autenticación requerida" }, { status: 401 }), session.cookiesToSet);
    const body = await request.json() as { text?: unknown; occurredAt?: unknown; idempotencyKey?: unknown };
    if (typeof body.text !== "string" || typeof body.occurredAt !== "string" || typeof body.idempotencyKey !== "string") return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    const entry = await new ProcessDiaryEntry({ diaryEntries: new SupabaseDiaryEntryRepository(), oracle: createOracleAgent(), loadOracleContext: loadOracleContextFromSupabase }).execute({ id: crypto.randomUUID(), playerId: session.user.id, idempotencyKey: body.idempotencyKey, text: body.text, occurredAt: new Date(body.occurredAt), submittedAt: new Date() });
    return withSessionCookies(NextResponse.json({ id: entry.id, oracleStatus: entry.oracleStatus, narrative: entry.oracleResponse?.narrative, oracleErrors: entry.oracleErrors }), session.cookiesToSet);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Error interno" }, { status: 500 }); }
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", { cookies: { getAll: () => cookieStore.getAll(), setAll: (entries) => { cookiesToSet.push(...entries); } } });
  const { data: { user } } = await supabase.auth.getUser();
  return { user, cookiesToSet };
}

function withSessionCookies(response: NextResponse, cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
  for (const cookie of cookiesToSet) response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
