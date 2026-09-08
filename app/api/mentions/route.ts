import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(req: Request){
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string){ return cookieStore.get(name)?.value },
        set(){}, remove(){}
      }
    }
  )

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if(!user){
    return NextResponse.json({ error: "Unauthorized - Please login" }, { status: 401 })
  }

  const { data: myPols } = await supabaseAuth.from("politicians").select("id").eq("user_id", user.id)

  if(!myPols || myPols.length===0){
    return NextResponse.json({ mentions: [], message: "No profile linked. Create your politician profile first." })
  }

  const myPolIds = myPols.map(p=>p.id)
  const { searchParams } = new URL(req.url)
  const politician_id = searchParams.get("politician_id")

  if(politician_id && !myPolIds.includes(politician_id)){
    return NextResponse.json({ error: "Forbidden - Not your profile" }, { status: 403 })
  }

  const targetIds = politician_id ? [politician_id] : myPolIds

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: mentions, error } = await supabase
    .from("mentions")
    .select("*")
    .in("politician_id", targetIds)
    .order("posted_at", { ascending: false })
    .limit(100)

  if(error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ 
    mentions,
    private: true,
    owner: user.email,
    count: mentions?.length || 0
  })
}
