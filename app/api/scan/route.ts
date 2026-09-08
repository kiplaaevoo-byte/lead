import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

function getTerms(pol:any){return [pol.name.split(" ").pop(),...(pol.keywords||[])].map((s:string)=>String(s).trim()).filter(Boolean).slice(0,2)}

async function scrapeRealTweets(term:string){
  const mirrors = ["nitter.poast.org","nitter.privacydev.net","nitter.fdn.fr","nitter.net"]
  for(const host of mirrors){
    try{
      const url = `https://${host}/search?f=tweets&q=${encodeURIComponent(term)}`
      const r = await fetch(url, {headers:{"User-Agent":"Mozilla/5.0"}, cache:"no-store", signal: AbortSignal.timeout(8000)})
      if(!r.ok) continue
      const html = await r.text()
      const blocks = [...html.matchAll(/<div class="tweet-content[^>]*>([\s\S]*?)<\/div>/g)].slice(0,8)
      const times = [...html.matchAll(/<span class="tweet-date"><a[^>]*title="([^"]+)"/g)]
      const links = [...html.matchAll(/<a class="tweet-link" href="([^"]+)"/g)]
      if(blocks.length===0) continue
      return blocks.map((b,i)=>{
        const text = b[1].replace(/<[^>]+>/g,"").trim()
        return {
          content:text,
          url: links[i]? `https://x.com${links[i][1].replace("#m","")}` : `https://x.com/search?q=${encodeURIComponent(term)}`,
          posted_at: times[i]? new Date(times[i][1]).toISOString() : new Date().toISOString()
        }
      }).filter(t=>t.content.length>15)
    }catch(e){ continue }
  }
  return []
}

export async function POST(req:Request){
  const body = await req.json().catch(()=>({}))
  let q = supabase.from("politicians").select("*")
  if(body.politician_id) q=q.eq("id", body.politician_id)
  const {data:pols} = await q
  if(!pols?.length) return NextResponse.json({success:false, message:"No politicians"})

  let total=0
  let samples:any[]=[]
  for(const p of pols){
    const terms = getTerms(p)
    for(const term of terms){
      const tweets = await scrapeRealTweets(term)
      for(const t of tweets){
        const row = {
          politician_id:p.id,
          platform:"X / Twitter",
          content:t.content,
          sentiment:t.content.toLowerCase().includes("corrupt")||t.content.toLowerCase().includes("bad")?"negative":t.content.toLowerCase().includes("good")||t.content.toLowerCase().includes("great")?"positive":"neutral",
          url:t.url,
          external_id:`x_${Buffer.from(t.url+t.content.slice(0,20)).toString("base64").slice(0,20)}`,
          author:"X User",
          posted_at:t.posted_at
        }
        const {error} = await supabase.from("mentions").upsert(row, {onConflict:"platform,external_id"})
        if(!error) total++
        samples.push(row)
        if(total>=15) break
      }
      if(total>=15) break
    }
    if(total>=15) break
  }

  return NextResponse.json({
    success:true,
    mode:"REAL FREE SCRAPER - NO X CREDITS NEEDED",
    scanned:pols.length,
    found:total,
    sample: samples[0]?.content?.slice(0,120),
    message: total>0? `Found ${total} REAL tweets` : "No mirrors responded, try again in 30s. Nitter mirrors sometimes down."
  })
}
export async function GET(){ return POST(new Request("https://lead-eosin.vercel.app/api/scan",{method:"POST", body:"{}"})) }