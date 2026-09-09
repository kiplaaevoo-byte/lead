import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest){
  const { name, email, password, county, position, phone, party } = await req.json()
  if(!name ||!email ||!phone ||!password) return NextResponse.json({error:"Missing fields"}, {status:400})

  const { data: exists } = await supabaseAdmin.from("politicians").select("id").eq("phone", phone).maybeSingle()
  if(exists) return NextResponse.json({error:"Phone already registered"}, {status:400})

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { name, phone }
  })
  if(authError) return NextResponse.json({error: authError.message}, {status:400})

  const userId = authUser.user.id

  const { error: polError } = await supabaseAdmin.from("politicians").insert({
    id: userId,
    name,
    email,
    county: county || "Bomet",
    position: position || "MCA",
    political_party: party,
    phone,
    is_demo: false,
    onboarding_complete: false,
  })
  if(polError){
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return NextResponse.json({error: polError.message}, {status:500})
  }

  await supabaseAdmin.from("subscriptions").insert({
    politician_id: userId,
    plan: "basic",
    status: "active",
    amount: 2000,
  })

  return NextResponse.json({ok:true, id: userId})
}