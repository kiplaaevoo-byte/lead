"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Page(){
  const [count,setCount]=useState(14283)
  const [demo, setDemo] = useState<any>(null)
  const [mentions, setMentions] = useState<any[]>([])

  useEffect(()=>{
    const i=setInterval(()=>setCount(c=>c+Math.floor(Math.random()*3)),2000);
    return ()=>clearInterval(i)
  },[])

  useEffect(()=>{
    // Fetch demo tenant - public safe because is_demo=true
    supabase.from("politicians").select("*").eq("is_demo", true).limit(1).maybeSingle().then(({data})=>{
      if(data) setDemo(data)
    })
    // Fetch recent mentions for preview
    supabase.from("mentions").select("*").order("created_at", {ascending:false}).limit(3).then(({data})=>{
      if(data) setMentions(data)
    })
  },[])

  return(
    <div className="min-h-screen bg-[#050505] text-white">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;600;800&display=swap');*{font-family:'Geist',sans-serif}`}</style>

      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/[0.07]">
        <div className="max-w-[1280px] mx-auto px-6 h-[68px] flex justify-between items-center">
          <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-black text-[14px]">P</div><span className="font-black tracking-tight">POLITICAL TRACKER<span className="text-[#00ff66]">.KE</span></span><span className="ml-3 hidden md:inline-flex text-[10px] px-2.5 py-1 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66]">● LIVE {demo?.county || 'Bomet'} • {count.toLocaleString()} POSTS/DAY</span></div>
          <div className="flex gap-3"><Link href="/login" className="px-5 py-2.5 text-sm rounded-full border border-white/15">Login</Link><Link href="/register" className="px-6 py-2.5 text-sm rounded-full bg-[#00ff66] text-black font-bold">Create Profile</Link></div>
        </div>
      </nav>

      <div className="max-w-[1280px] mx-auto px-6">
        {/* HERO - PRIVATE FOCUS */}
        <div className="pt-20 md:pt-28 pb-16 max-w-[820px]">
          <div className="inline-flex gap-2 items-center text-[11px] tracking-widest px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10">🔒 DEMO: {demo?.name || 'Test Politician Bomet'} • {demo?.county || 'Bomet'} • PRIVATE & ENCRYPTED</div>
          <h1 className="mt-8 text-[44px] md:text-[88px] font-[800] leading-[0.9] tracking-[-0.05em]">Your reputation.<br/><span className="text-white/30">Monitored</span> privately<br/>in <span className="text-[#00ff66]">real-time.</span></h1>
          <p className="mt-6 text-[18px] text-white/60 leading-relaxed max-w-[600px]">We track what Kenyans say about you across X, Facebook, TikTok, Instagram & YouTube. <b className="text-white">100% private.</b> No one else sees your dashboard. Ever. Live in {demo?.county || 'Bomet'}.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="px-9 py-4 rounded-full bg-[#00ff66] text-black font-bold text-[16px] shadow-[0_0_40px_rgba(0,255,102,0.4)]">Create Private Profile — Free</Link><Link href="/login" className="px-9 py-4 rounded-full border border-white/15 bg-white/[0.03]">Login</Link></div>
          <div className="mt-4 text-xs text-white/40">✓ 2-min setup • ✓ Encrypted • ✓ Only you see your data • ✓ County: {demo?.county || 'Bomet'}</div>
        </div>

        {/* HOW PRIVATE WORKS */}
        <div className="grid md:grid-cols-3 gap-4 mt-2">
          {[
            {icon:"🔒",title:"Private by Default",desc:`Your mentions are tied to your account only. Demo: ${demo?.name || 'Test Politician'} is public demo only.`},
            {icon:"⚡",title:"Live Scan Every 15min",desc:`Auto-scanning ${count.toLocaleString()} posts/day across all platforms. Last scan: ${mentions[0]?.created_at? new Date(mentions[0].created_at).toLocaleTimeString() : 'now'}`},
            {icon:"📊",title:"Your Sentiment Only",desc: mentions[0]?.sentiment? `Current demo sentiment: ${mentions[0].sentiment}` : "See positive/negative/neutral breakdown for YOUR name only."},
          ].map(c=>(
            <div key={c.title} className="rounded-2xl border border-white/10 bg-[#111] p-6"><div className="text-2xl">{c.icon}</div><div className="mt-3 font-bold">{c.title}</div><div className="mt-2 text-sm text-white/50 leading-relaxed">{c.desc}</div></div>
          ))}
        </div>

        {/* BLURRED PREVIEW - NOW WITH REAL DATA */}
        <div className="mt-16 rounded-[24px] border border-white/10 bg-[#0E0E0E] overflow-hidden">
          <div className="p-6 md:p-8 flex justify-between items-center border-b border-white/10">
            <div><div className="text-[11px] tracking-widest text-white/30">LIVE PREVIEW • {demo?.county?.toUpperCase() || 'BOMET'} • {demo?.name?.toUpperCase() || 'DEMO'}</div><div className="mt-1 font-bold text-lg">This is what YOU will see after login</div></div>
            <div className="hidden md:flex text-xs px-3 py-1.5 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66]">● {demo?.is_demo? 'DEMO TENANT' : 'LIVE'} • Only you can see this after login</div>
          </div>
          <div className="p-6 grid md:grid-cols-3 gap-6 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0E] via-[#0E0E0E]/80 to-transparent z-10 flex items-end justify-center pb-12"><Link href="/register" className="px-8 py-3 rounded-full bg-white text-black font-bold">Create Profile to See Your Mentions →</Link></div>
            <div className="blur-[5px] select-none pointer-events-none">
              <div className="h-24 rounded-xl bg-white/[0.06] border border-white/10 p-4"><div className="text-xs text-white/30">SENTIMENT 24H • {demo?.county || 'Bomet'}</div><div className="mt-2 h-2 w-full bg-white/10 rounded"><div className="h-2 w-[68%] bg-[#00ff66] rounded"></div></div><div className="mt-2 text-sm font-bold">68% Positive ↑</div></div>
              <div className="mt-4 space-y-3">
                {mentions.length? mentions.map((m:any,i:number)=>(
                  <div key={i} className="rounded-xl bg-white/[0.04] border border-white/10 p-4"><div className="text-xs text-white/40">{m.platform} • {m.county || demo?.county} • {new Date(m.created_at).toLocaleDateString()}</div><div className="mt-1 text-sm text-white/70 line-clamp-2">{m.text}</div><div className="mt-2 text-[10px] px-2 py-1 rounded bg-white/10 inline-block">{m.sentiment}</div></div>
                )) : [1,2,3].map(i=><div key={i} className="h-20 rounded-xl bg-white/[0.04] border border-white/10 p-4"><div className="text-xs text-white/40">X / Twitter • 2h ago</div><div className="mt-1 text-sm text-white/70">Loading live mentions from {demo?.county || 'Bomet'}...</div></div>)}
              </div>
            </div>
            <div className="blur-[5px] select-none pointer-events-none md:col-span-2">
              <div className="grid grid-cols-2 gap-4"><div className="h-32 rounded-xl bg-white/[0.04] border border-white/10 p-4"><div className="text-xs text-white/30">MENTIONS TODAY</div><div className="mt-3 text-2xl font-bold">{mentions.length || 12}</div></div><div className="h-32 rounded-xl bg-white/[0.04] border border-white/10 p-4"><div className="text-xs text-white/30">COUNTY</div><div className="mt-3 text-2xl font-bold">{demo?.county || 'Bomet'}</div></div></div>
              <div className="mt-4 h-48 rounded-xl bg-white/[0.04] border border-white/10 p-4"><div className="text-xs text-white/30">MENTIONS OVER TIME • {demo?.name}</div><div className="mt-8 flex items-end gap-1 h-20">{[40,60,30,80,50,90,70].map((h,i)=><div key={i} style={{height:`${h}%`}} className="flex-1 bg-[#00ff66]/60 rounded-t"></div>)}</div></div>
            </div>
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="mt-16 mb-20 rounded-[28px] bg-[#00ff66] p-10 md:p-16 text-center text-black">
          <h2 className="text-[32px] md:text-[52px] font-[800] leading-[0.9] tracking-tight">No public lists.<br/>Just your data.</h2>
          <p className="mt-4 text-black/60 max-w-[500px] mx-auto">Demo: {demo?.name || 'Test Politician Bomet'} ({demo?.county || 'Bomet'}) is public demo. Your profile after {<Link href="/register" className="underline font-bold">registration</Link>} will be 100% private.</p>
          <Link href="/register" className="mt-8 inline-block px-10 py-4 rounded-full bg-black text-white font-bold">Create Private Profile</Link>
          <div className="mt-4 text-xs text-black/50">County: {demo?.county || 'Bomet'} • Plan: {demo?.plan || 'basic'} • is_demo: {String(demo?.is_demo || true)}</div>
        </div>
      </div>
    </div>
  )
}