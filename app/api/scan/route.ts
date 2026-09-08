import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function getTerms(pol: any): string[] {
  return [pol.name,...(pol.keywords||[])].map((s:string)=>String(s).trim()).filter(Boolean).slice(0,3)
}

async function searchX(polId: string, terms: string[]){
  const token = process.env.X_BEARER_TOKEN
  if(!token) return { data: [], error: "Missing X_BEARER_TOKEN" }
  const query = terms.map(t=>`"${t}"`).join(" OR ")
  const url = `https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(`(${query}) -is:retweet lang:en`)}&max_results=10&tweet.fields=created_at,text&expansions=author_id&user.fields=username`
  try{
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
    const j = await r.json()
    if(!r.ok) return { data: [], error: `X API ${r.status}: ${JSON.stringify(j).slice(0,200)}` }
    const users = new Map((j.includes?.users||[]).map((u:any)=>[u.id, u.username]))
    const data = (j.data||[]).map((t:any)=>({
      politician_id: polId,
      platform: "X / Twitter",
      content: t.text,
      sentiment: "neutral",
      url: `https://x.com/i/web/status/${t.id}`,
      external_id: `x_${t.id}`,
      author: users.get(t.author_id)? `@${users.get(t.author_id)}` : "X User",
      posted_at: t.created_at
    }))
    return { data, error: null }
  }catch(e:any){ return { data: [], error: e.message } }
}

async function scanOne(pol: any){
  const terms = getTerms(pol)
  const x = await searchX(pol.id, terms)

  if(x.data.length > 0){
    const { error } = await supabase.from("mentions").upsert(x.data, { onConflict: "platform,external_id" })
    if(error) console.log(error)
  }
  return x
}

export async function POST(req: Request){
  const body = await req.json().catch(()=>({}))
  let q = supabase.from("politicians").select("*")
  if(body.politician_id) q = q.eq("id", body.politician_id)
  const { data: pols } = await q
  if(!pols?.length) return NextResponse.json({ success:false, message:"No politicians" })

  let total = 0
  let lastError: any = null
  let lastResult: any = null

  for(const p of pols){
    const res = await scanOne(p)
    total += res.data.length
    lastError = res.error
    lastResult = res
  }

  return NextResponse.json({
    success: true,
    mode: process.env.X_BEARER_TOKEN? "REAL" : "NO TOKEN SET",
    scanned: pols.length,
    found: total,
    x_error: lastError,
    message: total === 0? `No real posts found in last 7 days. Error: ${lastError || "none - just no tweets for those terms"}` : `Found ${total} REAL mentions`,
    debug_terms: pols[0]? getTerms(pols[0]) : []
  })
}

export async function GET(){
  return POST(new Request("https://lead-eosin.vercel.app/api/scan",{method:"POST", body:"{}"}))
}
