import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export type CookieToSet = { name: string; value: string; options: Record<string, unknown> };

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const cookiesToSet: CookieToSet[] = [];
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", { cookies: { getAll: () => cookieStore.getAll(), setAll: (entries) => { cookiesToSet.push(...entries); } } });
  const { data: { user } } = await supabase.auth.getUser();
  return { user, cookiesToSet };
}

export function withSessionCookies(response: NextResponse, cookiesToSet: CookieToSet[]) {
  for (const cookie of cookiesToSet) response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
