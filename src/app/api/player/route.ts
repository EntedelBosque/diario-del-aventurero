import { NextResponse } from "next/server";
import { getAuthenticatedUser, withSessionCookies } from "../session.ts";
import { createServiceSupabaseClient } from "../../../adapters/persistence/supabase-server.ts";

const STAT_ORDER = ["arte", "tecnologia", "vitalidad", "social", "sabiduria", "disciplina"];

export async function GET() {
  const { user, cookiesToSet } = await getAuthenticatedUser();
  if (!user) return withSessionCookies(NextResponse.json({ error: "Autenticación requerida" }, { status: 401 }), cookiesToSet);
  try {
    const supabase = createServiceSupabaseClient();
    const [playerResult, statsResult, guildsResult] = await Promise.all([
      supabase.from("players").select("display_name, character_class, initial_title, level, experience").eq("id", user.id).maybeSingle(),
      supabase.from("player_stats").select("stat_key, value, stat_definitions!inner(display_name, visibility)").eq("player_id", user.id).eq("stat_definitions.visibility", "visible"),
      supabase.from("player_guild_progress").select("guild_code, mastery").eq("player_id", user.id)
    ]);
    if (playerResult.error) throw new Error(playerResult.error.message);
    if (statsResult.error) throw new Error(statsResult.error.message);
    if (guildsResult.error) throw new Error(guildsResult.error.message);

    const player = playerResult.data;
    const stats = (statsResult.data ?? [])
      .map((row) => {
        const definition = row.stat_definitions as unknown as { display_name: string } | { display_name: string }[];
        const label = Array.isArray(definition) ? definition[0]?.display_name : definition?.display_name;
        return { key: row.stat_key as string, label: label ?? (row.stat_key as string), value: Number(row.value) };
      })
      .sort((a, b) => STAT_ORDER.indexOf(a.key) - STAT_ORDER.indexOf(b.key));

    const summary = {
      displayName: player?.display_name ?? "Aventurero",
      characterClass: player?.character_class ?? "Aventurero",
      title: player?.initial_title ?? "",
      level: player?.level ?? 1,
      experience: Number(player?.experience ?? 0),
      stats,
      guilds: (guildsResult.data ?? []).map((row) => ({ code: row.guild_code as string, mastery: Number(row.mastery) })).filter((guild) => guild.mastery > 0)
    };
    return withSessionCookies(NextResponse.json(summary), cookiesToSet);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error interno" }, { status: 500 });
  }
}
