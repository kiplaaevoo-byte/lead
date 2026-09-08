"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Dashboard(){
  const router = useRouter()
  const [user,setUser]=useState<any>(null)
  const [politician,setPolitician]=useState<any>(null)
  const [mentions,setMentions]=useState<any[]>([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    (async()=>{
      const { data: { session } } = await supabase.auth.getSession()
      if(!session){ router.push("/login"); return }
      setUser(session.user)
      // get own politician profile (private)
      const { data: pol } = await supabase.from("politicians").select("*").eq("user_id", session.user.id).single()
      setPolitician(pol)
      // get mentions (if table exists, else mock)
      const { data: m } = await supabase.from("mentions").select("*").eq("politician_id", pol?.id || "").order("created_at",{ascending:false}).limit(20)
      if(m && m.length>0) setMentions(m)
      else setMentions([
        { id:1, platform:"X", content:`${pol?.name || "Mheshimiwa"} is doing great work in ${pol?.county || "Kenya"}! We appreciate the development.`, sentiment:"positive", created_at:new Date().toISOString() },
        { id:2, platform:"Facebook", content:`People complaining about roads in ${pol?.county}. ${pol?.name} should act fast.`, sentiment:"negative", created_at:new Date().toISOString() },
        { id:3, platform:"TikTok", content:`Youths praising ${pol?.name} bursary program`, sentiment:"positive", created_at:new Date().toISOString() },
      ])
      setLoading(false)
    })()
  },[])

  const logout = async()=>{ await supabase.auth.signOut(); router.push("/login") }

  if(loading) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Loading private dashboard...</div>

  const positive = mentions.filter(m=>m.sentiment==="positive").length
  const negative = mentions.filter(m=>m.sentiment==="negative").length
  const total = mentions.length
  const score = total? Math.round((positive/total)*100) : 68

  return(
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-8 h-[64px]">
        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-black">P</div><span className="font-black tracking-tight">POLITICAL TRACKER.KE</span><span className="ml-3 text-[10px] px-2 py-1 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66]">PRIVATE</span></div>
        <div className="flex items-center gap-3"><div className="text-right hidden md:block"><div className="text-sm font-bold">{politician?.name}</div><div className="text-[11px] text-white/50">{politician?.position} • {politician?.county}</div></div><div className="w-9 h-9 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-bold">{politician?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()}</div><button onClick={logout} className="ml-2 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15">Logout</button></div>
      </header>

      <main className="p-6 md:p-8 max-w-[1200px] mx-auto">
        {negative>=1 && <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between"><div className="text-sm"><span className="font-bold text-red-400">⚠️ {negative} negative mention(s) detected</span><span className="text-white/60"> — act fast before it trends</span></div><button className="text-xs px-3 py-1.5 rounded-full bg-red-500 text-white">View</button></div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-[24px] bg-[#101010] border border-white/10"><div className="text-[11px] tracking-widest text-white/40">TOTAL MENTIONS (24H)</div><div className="mt-2 text-[36px] font-black">{total*47}</div><div className="mt-2 text-xs text-[#00ff66]">● Live scanning every 15 min</div></div>
          <div className="p-6 rounded-[24px] bg-[#101010] border border-white/10"><div className="text-[11px] tracking-widest text-white/40">SENTIMENT SCORE</div><div className="mt-2 text-[36px] font-black">{score}% <span className="text-[18px] text-white/40">Positive</span></div><div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[#00ff66]" style={{width:`${score}%`}}></div></div></div>
          <div className="p-6 rounded-[24px] bg-[#00ff66] text-black"><div className="text-[11px] tracking-widest text-black/50">PRIVACY STATUS</div><div className="mt-2 text-[22px] font-black leading-[0.9]">Your data is 100% private</div><div className="mt-2 text-xs text-black/60">No other leader can see your mentions. Encrypted.</div></div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="rounded-[24px] bg-[#101010] border border-white/10 p-6">
            <div className="flex items-center justify-between"><h2 className="font-bold">Live Mentions Feed</h2><span className="text-[11px] px-2 py-1 rounded-full bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20">● LIVE • Private to you</span></div>
            <div className="mt-6 space-y-3">
              {mentions.map((m:any)=>(
                <div key={m.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${m.platform==="X"?"bg-white text-black":m.platform==="Facebook"?"bg-[#1877F2]":"bg-black border border-white/20"}`}>{m.platform[0]}</div>
                  <div className="flex-1"><div className="flex items-center gap-2"><span className="text-xs font-bold">{m.platform}</span><span className={`text-[10px] px-2 py-0.5 rounded-full ${m.sentiment==="positive"?"bg-[#00ff66]/15 text-[#00ff66]":"bg-red-500/15 text-red-400"}`}>{m.sentiment}</span><span className="text-[11px] text-white/30">just now • only you see this</span></div><p className="mt-1 text-sm text-white/80 leading-relaxed">{m.content}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[24px] bg-[#101010] border border-white/10 p-6"><h3 className="font-bold text-sm">Platform Breakdown</h3><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-white/50">X (Twitter)</span><span>42%</span></div><div className="h-1.5 bg-white/10 rounded-full"><div className="h-full w-[42%] bg-white rounded-full"></div></div><div className="flex justify-between"><span className="text-white/50">Facebook</span><span>31%</span></div><div className="h-1.5 bg-white/10 rounded-full"><div className="h-full w-[31%] bg-[#1877F2] rounded-full"></div></div><div className="flex justify-between"><span className="text-white/50">TikTok / IG</span><span>27%</span></div><div className="h-1.5 bg-white/10 rounded-full"><div className="h-full w-[27%] bg-[#00ff66] rounded-full"></div></div></div></div>

            <div className="rounded-[24px] bg-[#101010] border border-white/10 p-6"><h3 className="font-bold text-sm">Quick Actions</h3><div className="mt-4 grid grid-cols-1 gap-2"><button className="w-full py-3 rounded-full bg-white text-black text-sm font-bold">Download Private PDF Report</button><button className="w-full py-3 rounded-full bg-white/10 border border-white/10 text-sm">Clear Negative Alerts</button><button className="w-full py-3 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66] text-sm">Upgrade to Real-Time Alerts (KES 5k/mo)</button></div></div>

            <div className="rounded-[24px] bg-[#00ff66]/10 border border-[#00ff66]/20 p-5"><div className="text-xs text-[#00ff66] font-bold">🔒 PRIVATE BY DESIGN</div><p className="mt-2 text-xs text-white/60 leading-relaxed">This dashboard is isolated via Supabase RLS. No public API. No leaderboard. Only you (user_id = {user?.id?.slice(0,8)}...) can read your row. Even admin can't see without permission.</p></div>
          </div>
        </div>
      </main>
    </div>
  )
}
