import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest){
  const {name, county, position, phone, password, party} = await req.json()
  if(!name ||!phone ||!password) return NextResponse.json({error:"Missing fields"}, {status:400})

  // Check exists
  const {data: exists} = await supabase.from("politicians").select("id").eq("phone", phone).maybeSingle()
  if(exists) return NextResponse.json({error:"Phone already registered"}, {status:400})

  const hashed = await bcrypt.hash(password, 10)

  // 1. Create auth user in politicians table (your custom auth)
  const id = crypto.randomUUID()
  const {data: pol, error} = await supabase.from("politicians").insert({
    id,
    name,
    county: county || "Bomet",
    position: position || "MCA",
    political_party: party,
    phone,
    password_hash: hashed,
    plan: "basic",
    is_demo: false,
    entitlements: {mentions_limit: 5, ward_intel:false},
    onboarding_complete: true
  }).select().single()

  if(error) return NextResponse.json({error: error.message}, {status:500})

  // 2. Create subscription trial - 7 days BASIC free
  await supabase.from("subscriptions").insert({
    politician_id: pol.id,
    plan: "basic",
    amount: 2000,
    status: "trialing",
    renewal_date: new Date(Date.now() + 7*24*60*60*1000).toISOString()
  })

  return NextResponse.json({ok:true, id: pol.id})
}