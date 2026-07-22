import { NextResponse } from "next/server";
import { getAuthenticatedUser, withSessionCookies } from "../session.ts";
import { createServiceSupabaseClient } from "../../../adapters/persistence/supabase-server.ts";

export async function GET() {
  const { user, cookiesToSet } = await getAuthenticatedUser();
  if (!user) return withSessionCookies(NextResponse.json({ error: "Autenticación requerida" }, { status: 401 }), cookiesToSet);
  try {
    const supabase = createServiceSupabaseClient();
    const [walletResult, rewardsResult] = await Promise.all([
      supabase.from("currency_wallets").select("balance").eq("player_id", user.id).eq("currency_code", "monedas_aventurero").maybeSingle(),
      supabase.from("market_rewards").select("id, name, description, cost, category").eq("player_id", user.id).eq("status", "activa").order("cost", { ascending: true })
    ]);
    if (walletResult.error) throw new Error(walletResult.error.message);
    if (rewardsResult.error) throw new Error(rewardsResult.error.message);
    const balance = Number(walletResult.data?.balance ?? 0);
    const rewards = (rewardsResult.data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      cost: Number(row.cost),
      category: row.category as string
    }));
    return withSessionCookies(NextResponse.json({ balance, rewards }), cookiesToSet);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error interno" }, { status: 500 });
  }
}
