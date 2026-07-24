import { NextResponse } from "next/server";
import { getAuthenticatedUser, withSessionCookies } from "../session.ts";
import { getEntityHistory } from "../../../adapters/persistence/supabase-world-repository.ts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { user, cookiesToSet } = await getAuthenticatedUser();
  if (!user) return withSessionCookies(NextResponse.json({ error: "Autenticación requerida" }, { status: 401 }), cookiesToSet);
  const entityId = new URL(request.url).searchParams.get("id");
  if (!entityId) return NextResponse.json({ error: "Falta el identificador de la entidad" }, { status: 400 });
  try {
    const history = await getEntityHistory(user.id, entityId);
    return withSessionCookies(NextResponse.json({ history }), cookiesToSet);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error interno" }, { status: 500 });
  }
}
