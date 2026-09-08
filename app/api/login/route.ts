import { createClient } from "@supabase/supabase-js"
export const dynamic = "force-dynamic"
export async function POST(req: Request) {
  const { email, password } = await req.json()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return Response.json({ error: error.message }, { status: 401 })
  return Response.json({ ok: true, session: data.session })
}