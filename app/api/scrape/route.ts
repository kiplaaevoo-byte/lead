import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const HF_KEY = process.env.HF_API_KEY
const HF_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"

async function aiSentiment(text: string){
  if(!HF_KEY) return { label:"neutral", score:0.5 }
  try{
    const res = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`,{
      method:"POST",
      headers:{ Authorization:`Bearer ${HF_KEY}`, "Content-Type":"application/json" },
      body: JSON.stringify({ inputs: text.slice(0,500) })
    })
    const j = await res.json()
    const arr = Array.isArray(j[0])? j[0] : j
    const top = arr?.sort((a:any,b:any)=>b.score-a.score)?.[0]
    if(!top) return { label:"neutral", score:0.5 }
    const l = top.label.toLowerCase()
    if(l.includes("pos")) return { label:"positive", score:top.score }
    if(l.includes("neg")) return { label:"negative", score:top.score }
    return { label:"neutral", score:top.score }
  }catch{ return { label:"neutral", score:0.5 } }
}

export async function GET(){
  const { data: politicians } = await supabase.from("politicians").select("id,name").limit(20)
  if(!politicians || politicians.length===0) return NextResponse.json({ error:"no politicians found", ok:false })

  let inserted = 0
  for(const pol of politicians){
    const samples = [
      `${pol.name} development record praised in Bomet`,
      `Residents complain about ${pol.name} failed promises`,
      `${pol.name} bursary program helps students`
    ]
    for(const content of samples){
      const ai = await aiSentiment(content)
      await supabase.from("mentions").insert({
        politician_id: pol.id,
        platform: "X",
        content,
        sentiment: ai.label,
        sentiment_score: ai.score
      })
      inserted++
      await new Promise(r=>setTimeout(r, 600))
    }
  }
  return NextResponse.json({ ok:true, model:HF_MODEL, hasKey:!!HF_KEY, inserted })
}
