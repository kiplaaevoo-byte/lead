import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest){
  const {phone, password} = await req.json()
  const {data: pol} = await supabase.from("politicians").select("*").eq("phone", phone).eq("is_demo", false).single()
  if(!pol) return NextResponse.json({error:"Account not found or is demo"}, {status:404})

  const ok = await bcrypt.compare(password, pol.password_hash)
  if(!ok) return NextResponse.json({error:"Wrong password"}, {status:401})

  const token = jwt.sign({id: pol.id, phone: pol.phone}, process.env.JWT_SECRET || "siasa-secret", {expiresIn:"7d"})

  const res = NextResponse.json({ok:true, politician: pol})
  res.cookies.set("siasa_token", token, {httpOnly:true, maxAge:60*60*24*7})
  return res
}