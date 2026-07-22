import { NextResponse } from "next/server";
import { getAuthenticatedUser, withSessionCookies } from "../session.ts";
import { createServiceSupabaseClient } from "../../../adapters/persistence/supabase-server.ts";

export async function GET() {
  const { user, cookiesToSet } = await getAuthenticatedUser();
  if (!user) return withSessionCookies(NextResponse.json({ error: "Autenticación requerida" }, { status: 401 }), cookiesToSet);
  try {
    const { data, error } = await createServiceSupabaseClient()
      .from("contracts")
      .select("id, contract_type, objective, state, difficulty, priority, categories, rewards, expires_at")
      .eq("player_id", user.id)
      .in("state", ["disponible", "activo", "completado"])
      .order("expires_at", { ascending: true });
    if (error) throw new Error(error.message);
    const contracts = (data ?? []).map((row) => ({
      id: row.id as string,
      type: row.contract_type as string,
      objective: row.objective as string,
      state: row.state as string,
      difficulty: row.difficulty as string,
      priority: row.priority as string,
      categories: (row.categories as string[] | null) ?? [],
      rewards: row.rewards as unknown,
      expiresAt: row.expires_at as string
    }));
    return withSessionCookies(NextResponse.json({ contracts }), cookiesToSet);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error interno" }, { status: 500 });
  }
}
