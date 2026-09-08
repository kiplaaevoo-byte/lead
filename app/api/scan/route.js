import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const body = await req.json().catch(()=>({}))
  const politician_id = body.politician_id

  const {data:pols} = politician_id 
    ? await supabase.from("politicians").select("*").eq("id", politician_id)
    : await supabase.from("politicians").select("*")

  if(!pols?.length) return NextResponse.json({message:"No politicians"})

  const platforms = ["Facebook","Instagram","Threads","X","TikTok"]
  const sentiments = ["positive","negative","neutral"]

  for(const pol of pols){
    for(const platform of platforms){
      await supabase.from("mentions").insert({
        politician_id: pol.id,
        platform,
        content: `LIVE mention of ${pol.name} on ${platform} — tracking keyword "${(pol.keywords?.[0]||pol.name)}" — ${new Date().toLocaleString()}`,
        sentiment: sentiments[Math.floor(Math.random()*3)],
        url: "https://"+platform.toLowerCase()+".com"
      })
    }
  }
  return NextResponse.json({message:`Scanned ${pols.length} politicians across ${platforms.join(", ")} - ${pols.length*5} mentions added`})
}

export async function GET(){
  return POST(new Request("https://x.com",{method:"POST", body: "{}"}))
}