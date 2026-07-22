import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", {
    cookies: { getAll: () => request.cookies.getAll(), setAll: (entries) => entries.forEach((cookie) => response.cookies.set(cookie.name, cookie.value, cookie.options)) }
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && request.nextUrl.pathname === "/") return NextResponse.redirect(new URL("/login", request.url));
  if (user && request.nextUrl.pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
  return response;
}

export const config = { matcher: ["/", "/login"] };
