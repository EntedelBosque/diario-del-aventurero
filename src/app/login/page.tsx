"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error } = await supabase.auth.signInWithPassword({ email: String(data.get("email")), password: String(data.get("password")) });
    if (error) { setMessage(error.message); return; }
    router.push("/");
    router.refresh();
  }

  return <main><h1>Iniciar sesión</h1><form onSubmit={login}><label>Correo<input type="email" name="email" required /></label><label>Contraseña<input type="password" name="password" required /></label><button>Entrar</button></form>{message && <p className="result error">{message}</p>}</main>;
}
