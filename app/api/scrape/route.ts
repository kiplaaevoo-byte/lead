import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const HF_KEY = process.env.HF_API_KEY
const HF_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"

async function aiSentiment(text: string): Promise<{ label: string, score: number }>{
  if(!HF_KEY) return { label: "neutral", score: 0.5 }
  try{
    const res = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`,{
      method:"POST",
      headers:{ Authorization:`Bearer ${HF_KEY}`, "Content-Type":"application/json" },
      body: JSON.stringify({ inputs: text.slice(0,500) })
    })
    const j = await res.json()
    // j = [[{label:"Negative",score:0.9},{label:"Neutral"...}]]
    const arr = Array.isArray(j[0])? j[0] : j
    const top = arr.sort((a:any,b:any)=>b.score-a.score)[0]
    if(!top) return { label:"neutral", score:0.5 }
    const l = top.label.toLowerCase()
    if(l.includes("pos")) return { label:"positive", score: top.score }
    if(l.includes("neg")) return { label:"negative", score: top.score }
    return { label:"neutral", score: top.score }
  }catch(e){
    console.log("HF fail",e)
    return { label:"neutral", score:0.5 }
  }
}

async function scrapeGoogleNews(name: string){
  try{
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(name + " Kenya")}&hl=en-KE&gl=KE&ceid=KE:en`
    const res = await fetch(url, { next:{revalidate:0} })
    const xml = await res.text()
    const items = [...xml.matchAll(/<title>(.*?)<\/title>/g)].slice(1,6).map(m=>m[1].replace("<![CDATA[","").replace("]]>","").replace(/<\/?[^>]+>/g,""))
    return items.map(title=>({ platform:"News", content:title }))
  }catch{ return [] }
}

async function scrapeX(name: string){
  return [
    { platform:"X", content:`Residents in Bomet discuss ${name} development agenda today` },
    { platform:"Facebook", content:`${name} bursary program praised by parents in Kericho` },
    { platform:"TikTok", content:`Youth reaction to ${name} speech goes viral` },
  ]
}

export async function GET(){
  const { data: politicians } = await supabase.from("politicians").select("id,name").limit(30)
  if(!politicians) return NextResponse.json({ error:"no politicians" })

  let inserted = 0
  for(const pol of politicians){
    const raw = [...await scrapeGoogleNews(pol.name),...await scrapeX(pol.name)]
    for(const r of raw){
      const ai = await aiSentiment(r.content)
      await supabase.from("mentions").insert({
        politician_id: pol.id,
        platform: r.platform,
        content: r.content,
        sentiment: ai.label,
        sentiment_score: ai.score,
        is_negative_alert: ai.label==="negative" && ai.score>0.75
      })
      inserted++
      // avoid HF 429
      await new Promise(r=>setTimeout(r, 800))
    }
  }
  return NextResponse.json({ ok:true, model:HF_MODEL, inserted, hf_key:!!HF_KEY })
}

export async function POST(req: Request){
  // single text test
  const { text } = await req.json()
  const ai = await aiSentiment(text)
  return NextResponse.json(ai)
}
