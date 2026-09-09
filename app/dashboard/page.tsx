"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Dashboard(){
  const router = useRouter()
  const [politician,setPolitician]=useState<any>(null)
  const [mentions,setMentions]=useState<any[]>([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    (async()=>{
      const storedId = localStorage.getItem("siasa_user_id")
      const storedPhone = localStorage.getItem("siasa_phone")
      if(!storedId &&!storedPhone){ router.push("/login"); return }

      let pol = null
      if(storedId){
        const {data} = await supabase.from("politicians").select("*").eq("id", storedId).maybeSingle()
        pol = data
      }
      if(!pol && storedPhone){
        const {data} = await supabase.from("politicians").select("*").eq("phone", storedPhone).maybeSingle()
        pol = data
      }
      if(!pol){ localStorage.clear(); router.push("/register"); return }

      setPolitician(pol)
      const {data: m} = await supabase.from("mentions").select("*").eq("politician_id", pol.id).order("created_at",{ascending:false}).limit(50)
      setMentions(m || [])
      setLoading(false)
    })()
  },[])

  const logout = ()=>{ localStorage.clear(); router.push("/login") }

  if(loading) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Loading REAL dashboard...</div>

  const positive = mentions.filter(m=>m.sentiment==="positive").length
  const total = mentions.length
  const score = total? Math.round((positive/total)*100) : 0

  return(
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 h-[64px]">
        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-black">P</div><span className="font-black">POLITICAL TRACKER<span className="text-[#00ff66]">.KE</span></span><span className="ml-3 text-[10px] px-2 py-1 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66]">REAL • {politician?.county}</span></div>
        <div className="flex items-center gap-3"><div className="text-right hidden md:block"><div className="text-sm font-bold">{politician?.name}</div><div className="text-[11px] text-white/50">{politician?.phone} • {politician?.county}</div></div><button onClick={logout} className="text-xs px-3 py-1.5 rounded-full bg-white/10">Logout</button></div>
      </header>
      <main className="p-6 md:p-8 max-w-[1200px] mx-auto">
        <h1 className="text-2xl font-bold">Welcome, {politician?.name} 👋 REAL</h1>
        <p className="text-sm text-white/50 mt-1">Phone: {politician?.phone} • County: {politician?.county} • Plan: {politician?.plan || 'basic'}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-6 rounded-[24px] bg-[#101010] border border-white/10"><div className="text-[11px] text-white/40">REAL MENTIONS</div><div className="mt-2 text-[36px] font-black">{total}</div></div>
          <div className="p-6 rounded-[24px] bg-[#101010] border border-white/10"><div className="text-[11px] text-white/40">SENTIMENT</div><div className="mt-2 text-[36px] font-black">{total? `${score}%` : "—"}</div></div>
          <div className="p-6 rounded-[24px] bg-[#00ff66] text-black"><div className="text-[11px] text-black/50">STATUS</div><div className="mt-2 text-[18px] font-black">100% REAL & PRIVATE</div><div className="text-xs text-black/60 mt-1">ID: {politician?.id.slice(0,8)}</div></div>
        </div>

        <div className="mt-8 rounded-[24px] bg-[#101010] border border-white/10 p-6">
          <h2 className="font-bold">Live Mentions Feed — REAL for {politician?.name}</h2>
          <div className="mt-6">
            {total===0? (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                <div className="text-3xl">📡</div>
                <div className="mt-3 font-bold">No real mentions yet for {politician?.name}</div>
                <div className="mt-1 text-sm text-white/50">Scanner active for {politician?.name} in {politician?.county}. Real data will appear here.</div>
              </div>
            ) : mentions.map((m:any)=>(
              <div key={m.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 mb-3"><div className="text-xs font-bold">{m.platform} • {m.sentiment}</div><p className="mt-1 text-sm text-white/80">{m.text || m.content}</p></div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}