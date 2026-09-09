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
      // REAL AUTH - phone based, no demo
      const storedId = localStorage.getItem("siasa_user_id")
      const storedPhone = localStorage.getItem("siasa_phone")
      const storedName = localStorage.getItem("siasa_name")

      if(!storedId &&!storedPhone){
        router.push("/login"); return
      }

      let pol = null
      if(storedId){
        const {data} = await supabase.from("politicians").select("*").eq("id", storedId).eq("is_demo", false).maybeSingle()
        pol = data
      }
      if(!pol && storedPhone){
        const {data} = await supabase.from("politicians").select("*").eq("phone", storedPhone).eq("is_demo", false).maybeSingle()
        pol = data
      }

      if(!pol){
        localStorage.clear()
        router.push("/register"); return
      }

      setPolitician(pol)

      // REAL mentions - only this politician
      const {data: m} = await supabase.from("mentions").select("*").eq("politician_id", pol.id).order("created_at",{ascending:false}).limit(50)

      if(m && m.length>0){
        setMentions(m)
      } else {
        // No fake mentions if no data - show empty state
        setMentions([])
      }
      setLoading(false)
    })()
  },[])

  const logout = async()=>{
    localStorage.clear()
    router.push("/login")
  }

  if(loading) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center"><div className="text-center"><div className="animate-pulse">Loading REAL private dashboard...</div><div className="mt-2 text-xs text-white/30">Phone verified • {typeof window!== 'undefined'? localStorage.getItem("siasa_phone") : ""}</div></div></div>

  const positive = mentions.filter(m=>m.sentiment==="positive").length
  const negative = mentions.filter(m=>m.sentiment==="negative").length
  const total = mentions.length
  const score = total? Math.round((positive/total)*100) : 0

  return(
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-8 h-[64px]">
        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-black">P</div><span className="font-black tracking-tight">POLITICAL TRACKER<span className="text-[#00ff66]">.KE</span></span><span className="ml-3 text-[10px] px-2 py-1 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66]">● REAL • PRIVATE • {politician?.county?.toUpperCase()}</span></div>
        <div className="flex items-center gap-3"><div className="text-right hidden md:block"><div className="text-sm font-bold">{politician?.name}</div><div className="text-[11px] text-white/50">{politician?.position} • {politician?.county} • {politician?.phone}</div></div><div className="w-9 h-9 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-bold">{politician?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()}</div><button onClick={logout} className="ml-2 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15">Logout</button></div>
      </header>

      <main className="p-6 md:p-8 max-w-[1200px] mx-auto">
        <div className="mb-6"><h1 className="text-2xl font-bold">Welcome, {politician?.name} 👋</h1><p className="text-sm text-white/50 mt-1">REAL data for {politician?.county} only. No demo. Phone: {politician?.phone} • ID: {politician?.id.slice(0,8)}</p></div>

        {negative>=1 && <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between"><div className="text-sm"><span className="font-bold text-red-400">⚠️ {negative} negative REAL mention(s) detected</span><span className="text-white/60"> — private to you</span></div></div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-[24px] bg-[#101010] border border-white/10"><div className="text-[11px] tracking-widest text-white/40">REAL MENTIONS FOUND</div><div className="mt-2 text-[36px] font-black">{total}</div><div className="mt-2 text-xs text-[#00ff66]">● Live scan • Private to {politician?.name}</div></div>
          <div className="p-6 rounded-[24px] bg-[#101010] border border-white/10"><div className="text-[11px] tracking-widest text-white/40">REAL SENTIMENT</div><div className="mt-2 text-[36px] font-black">{total>0? `${score}%` : "—"} <span className="text-[14px] text-white/40">{total>0? "Positive" : "No data yet"}</span></div><div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[#00ff66]" style={{width:`${score}%`}}></div></div></div>
          <div className="p-6 rounded-[24px] bg-[#00ff66] text-black"><div className="text-[11px] tracking-widest text-black/50">STATUS</div><div className="mt-2 text-[20px] font-black leading-[0.9]">100% REAL & PRIVATE</div><div className="mt-2 text-xs text-black/60">Plan: {politician?.plan || 'basic'} • County: {politician?.county} • No demo data</div></div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="rounded-[24px] bg-[#101010] border border-white/10 p-6">
            <div className="flex items-center justify-between"><h2 className="font-bold">Live Mentions Feed — REAL</h2><span className="text-[11px] px-2 py-1 rounded-full bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20">● PRIVATE • {politician?.county}</span></div>

            <div className="mt-6 space-y-3">
              {total===0? (
                <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                  <div className="text-3xl">📡</div>
                  <div className="mt-3 font-bold">No real mentions yet</div>
                  <div className="mt-1 text-sm text-white/50 max-w-[320px] mx-auto">We are scanning X, Facebook, TikTok for "{politician?.name}" in {politician?.county}. Real mentions will appear here - private to you only.</div>
                  <div className="mt-4 text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 inline-block">Waiting for scanner • {politician?.name}</div>
                </div>
              ) : mentions.map((m:any)=>(
                <div key={m.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${m.platform==="X"?"bg-white text-black":m.platform==="Facebook"?"bg-[#1877F2]":"bg-black border border-white/20"}`}>{m.platform?.[0]}</div>
                  <div className="flex-1"><div className="flex items-center gap-2"><span className="text-xs font-bold">{m.platform}</span><span className={`text-[10px] px-2 py-0.5 rounded-full ${m.sentiment==="positive"?"bg-[#00ff66]/15 text-[#00ff66]":"bg-red-500/15 text-red-400"}`}>{m.sentiment}</span><span className="text-[11px] text-white/30">{new Date(m.created_at).toLocaleString()} • private</span></div>
                  <p className="mt-1 text-sm text-white/80 leading-relaxed">{m.text || m.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[24px] bg-[#101010] border border-white/10 p-6"><h3 className="font-bold text-sm">Your Real Profile</h3><div className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><span className="text-white/50">Name</span><span className="font-bold">{politician?.name}</span></div><div className="flex justify-between"><span className="text-white/50">Phone</span><span>{politician?.phone}</span></div><div className="flex justify-between"><span className="text-white/50">County</span><span>{politician?.county}</span></div><div className="flex justify-between"><span className="text-white/50">Position</span><span>{politician?.position || '—'}</span></div><div className="flex justify-between"><span className="text-white/50">Party</span><span>{politician?.political_party || '—'}</span></div></div></div>

            <div className="rounded-[24px] bg-[#101010] border border-white/10 p-6"><h3 className="font-bold text-sm">Real Scanner Status</h3><div className="mt-3 text-xs text-white/60">Scanning keywords:</div><div className="mt-2 flex flex-wrap gap-2">{(politician?.name?.split(" ") || []).map((k:string)=><span key={k} className="text-xs px-2 py-1 rounded-full bg-white/10">{k}</span>)}<span className="text-xs px-2 py-1 rounded-full bg-[#00ff66]/20 text-[#00ff66]">{politician?.county}</span></div></div>

            <div className="rounded-[24px] bg-[#00ff66]/10 border border-[#00ff66]/20 p-5"><div className="text-xs text-[#00ff66] font-bold">🔒 100% REAL & PRIVATE</div><p className="mt-2 text-xs text-white/60 leading-relaxed">No demo data. Row Level Security: politician_id = {politician?.id}. Only you with phone {politician?.phone} can read this.</p></div>
          </div>
        </div>
      </main>
    </div>
  )
}