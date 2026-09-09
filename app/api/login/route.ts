import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest){
  try{
    const {phone, password} = await req.json()
    console.log("Login attempt:", phone)

    const {data: pol, error} = await supabase
      .from("politicians")
      .select("*")
      .eq("phone", phone)
      .eq("is_demo", false)
      .maybeSingle()

    if(error || !pol){
      return NextResponse.json({error:"Account not found. Register first"}, {status:404})
    }

    if(!pol.password_hash){
      return NextResponse.json({error:"No password set. Re-register"}, {status:400})
    }

    const ok = await bcrypt.compare(password, pol.password_hash)
    if(!ok){
      return NextResponse.json({error:"Wrong password"}, {status:401})
    }

    // Success - set cookie + return data
    const res = NextResponse.json({ok:true, politician: pol, redirect:"/dashboard"})
    res.cookies.set("siasa_user_id", pol.id, {
      httpOnly: false, // allow JS read for now
      maxAge: 60*60*24*7,
      path: "/"
    })
    res.cookies.set("siasa_phone", pol.phone, {
      maxAge: 60*60*24*7,
      path: "/"
    })

    return res

  }catch(e:any){
    console.error(e)
    return NextResponse.json({error: e.message}, {status:500})
  }
}