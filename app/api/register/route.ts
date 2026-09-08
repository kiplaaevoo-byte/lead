import { createClient } from "@supabase/supabase-js"
export const dynamic = "force-dynamic"
export async function POST(req: Request) {
  const { email, password, name, county, position } = await req.json()
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: userData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { name }
  })
  if (authErr) return Response.json({ error: authErr.message }, { status: 400 })
  const { error: polErr } = await supabaseAdmin.from("politicians").insert({
    id: crypto.randomUUID(),
    user_id: userData.user.id,
    name: name || email.split('@')[0],
    email, county: county || "Kenya",
    position: position || "MCA",
    status: "verified", plan: "basic",
    slug: (name || email).toLowerCase().replace(/\s+/g,'-') + '-' + Date.now().toString().slice(-4)
  })
  if (polErr) return Response.json({ error: polErr.message }, { status: 400 })
  return Response.json({ ok: true })
}