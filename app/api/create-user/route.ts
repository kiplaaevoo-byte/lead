import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: Request){
  const { name, email, password, phone, position, county } = await req.json()
  // create user with auto-confirm = true -> NO EMAIL SENT
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name }
  })
  if(error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { error: pError } = await admin.from("politicians").insert({
    name, email, phone, position, county,
    user_id: data.user.id
  })
  if(pError) return NextResponse.json({ error: pError.message }, { status: 400 })
  return NextResponse.json({ ok:true, userId: data.user.id })
}
