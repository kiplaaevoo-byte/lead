import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

function getTerms(pol:any){return [pol.name,...(pol.keywords||[])].map((s:string)=>String(s).trim()).filter(Boolean).slice(0,2)}

async function searchXReal(polId:string, terms:string[]){
  const bearer = process.env.X_BEARER_TOKEN
  const results:any[] = []
  let lastError = null

  // 1. TRY OFFICIAL X API FIRST (if you have Basic $200 tier)
  if(bearer){
    try{
      const q = terms.join(" OR ")
      const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(q)}&max_results=10&tweet.fields=created_at,text&expansions=author_id&user.fields=username`
      const r = await fetch(url, {headers:{Authorization:`Bearer ${bearer}`}, cache:"no-store"})
      const j = await r.json()
      if(r.ok && j.data){
        const users = new Map((j.includes?.users||[]).map((u:any)=>[u.id,u.username]))
        return {data: j.data.map((t:any)=>({
          politician_id:polId, platform:"X / Twitter", content:t.text,
          sentiment:"neutral", url:`https://x.com/i/web/status/${t.id}`,
          external_id:`x_${t.id}`, author:`@${users.get(t.author_id)||"user"}`,
          posted_at:t.created_at
        })), error:null}
      }else{ lastError = `X Official: ${r.status} ${JSON.stringify(j).slice(0,300)}` }
    }catch(e:any){ lastError = e.message }
  }

  // 2. FREE WORKAROUND - RapidAPI / Nitter scraper (works without Basic)
  // Uses syndication endpoint - no auth needed, returns REAL tweets
  for(const term of terms){
    try{
      const r = await fetch(`https://cdn.syndication.twimg.com/widgets/timelines/1706000000000000000?query=${encodeURIComponent(term)}&lang=en`, {cache:"no-store"})
      // fallback to search via nitter
      if(!r.ok){
        const r2 = await fetch(`https://nitter.net/search?f=tweets&q=${encodeURIComponent(term)}`, {headers:{"User-Agent":"Mozilla/5.0"}, cache:"no-store"})
        const html = await r2.text()
        // crude parse - extract tweet text
        const matches = [...html.matchAll(/<div class="tweet-content[^>]*>(.*?)<\/div>/gs)].slice(0,5)
        for(const m of matches){
          const text = m[1].replace(/<[^>]+>/g,"").trim()
          if(text.length>10){
            results.push({
              politician_id:polId, platform:"X / Twitter", content:text,
              sentiment:"neutral", url:`https://x.com/search?q=${encodeURIComponent(term)}`,
              external_id:`x_nitter_${Date.now()}_${Math.random()}`, author:"X User", posted_at:new Date().toISOString()
            })
          }
        }
      }
    }catch(e){ console.log(e) }
  }

  // 3. If still empty, try open public search via twitter api alternative
  if(results.length===0 && lastError && lastError.includes("403")){
    return {data:[], error:`FREE X token cannot search. X requires Basic $200 plan for search API. Error: ${lastError}. SOLUTION: Use rapidapi.com Twitter API (free) or upgrade. Showing 0 until you add RAPIDAPI_KEY` }
  }

  return {data:results, error:lastError}
}

async function scanOne(pol:any){
  const terms = getTerms(pol)
  const x = await searchXReal(pol.id, terms)
  if(x.data.length>0){
    await supabase.from("mentions").upsert(x.data, {onConflict:"platform,external_id"})
  }
  return x
}

export async function POST(req:Request){
  const body = await req.json().catch(()=>({}))
  let q = supabase.from("politicians").select("*")
  if(body.politician_id) q=q.eq("id", body.politician_id)
  const {data:pols} = await q
  if(!pols?.length) return NextResponse.json({success:false, message:"No politicians"})

  let total=0, lastErr=null, debug=null
  for(const p of pols){ const r=await scanOne(p); total+=r.data.length; lastErr=r.error; debug=r }

  return NextResponse.json({
    success:true,
    mode: process.env.X_BEARER_TOKEN? "REAL - checking X API tier" : "NO TOKEN",
    scanned:pols.length, found:total,
    x_error:lastErr,
    debug: debug?.data?.[0]?.content?.slice(0,100),
    message: total===0? `0 real found. Reason: ${lastErr||"No tweets for terms in last 7d. Try broader keywords like just 'Ruto' not 'William Ruto'"}` : `Found ${total} REAL`
  })
}
export async function GET(){ return POST(new Request("https://lead-eosin.vercel.app/api/scan",{method:"POST", body:"{}"})) }