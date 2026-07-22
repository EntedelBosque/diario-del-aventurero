import { NextResponse } from "next/server";
import { getAuthenticatedUser, withSessionCookies } from "../session.ts";
import { listWorldEntities } from "../../../adapters/persistence/supabase-world-repository.ts";

export async function GET() {
  const { user, cookiesToSet } = await getAuthenticatedUser();
  if (!user) return withSessionCookies(NextResponse.json({ error: "Autenticación requerida" }, { status: 401 }), cookiesToSet);
  try {
    const entities = await listWorldEntities(user.id);
    return withSessionCookies(NextResponse.json({ entities }), cookiesToSet);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error interno" }, { status: 500 });
  }
}
