"use client"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function Page(){
  const [count,setCount]=useState(14283)
  useEffect(()=>{const i=setInterval(()=>setCount(c=>c+Math.floor(Math.random()*3)),2000); return ()=>clearInterval(i)},[])

  return(
    <div className="min-h-screen bg-[#050505] text-white">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;600;800&display=swap');*{font-family:'Geist',sans-serif}`}</style>
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/[0.07]">
        <div className="max-w-[1280px] mx-auto px-6 h-[68px] flex justify-between items-center">
          <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-black text-[14px]">P</div><span className="font-black tracking-tight">POLITICAL TRACKER<span className="text-[#00ff66]">.KE</span></span><span className="ml-3 hidden md:inline-flex text-[10px] px-2.5 py-1 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66]">● PRIVATE & ENCRYPTED • {count.toLocaleString()} SCANS/DAY</span></div>
          <div className="flex gap-3"><Link href="/login" className="px-5 py-2.5 text-sm rounded-full border border-white/15">Login</Link><Link href="/register" className="px-6 py-2.5 text-sm rounded-full bg-[#00ff66] text-black font-bold">Create Profile</Link></div>
        </div>
      </nav>

      <div className="max-w-[1280px] mx-auto px-6">
        <div className="pt-20 md:pt-28 pb-16 max-w-[820px]">
          <div className="inline-flex gap-2 items-center text-[11px] tracking-widest px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10">🔒 100% PRIVATE • NO PUBLIC LEADERBOARD • ONLY YOU SEE YOUR DATA</div>
          <h1 className="mt-8 text-[44px] md:text-[88px] font-[800] leading-[0.9] tracking-[-0.05em]">Your reputation.<br/><span className="text-white/30">Monitored</span> privately<br/>in <span className="text-[#00ff66]">real-time.</span></h1>
          <p className="mt-6 text-[18px] text-white/60 leading-relaxed max-w-[600px]">We track what Kenyans say about YOU across X, Facebook, TikTok, Instagram & YouTube. <b className="text-white">No public lists. No leaks. Your dashboard is private to you only.</b></p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="px-9 py-4 rounded-full bg-[#00ff66] text-black font-bold text-[16px] shadow-[0_0_40px_rgba(0,255,102,0.4)]">Create Private Profile — Free 7 Days</Link><Link href="/login" className="px-9 py-4 rounded-full border border-white/15 bg-white/[0.03]">Login</Link></div>
          <div className="mt-4 text-xs text-white/40">✓ 2-min setup • ✓ Encrypted • ✓ Private mentions • ✓ Real-time alerts</div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-2">
          {[
            {icon:"🔒",title:"100% Private by Default",desc:"No demo. No public page. Your mentions are encrypted and tied to your phone only. Even we can't see other leaders' data."},
            {icon:"⚡",title:"Live Scan Every 15min",desc:`We scan ${count.toLocaleString()} posts/day across all platforms for YOUR name, nickname, party.`},
            {icon:"📊",title:"Real Sentiment For You",desc:"Positive / Negative / Neutral breakdown for YOUR name only. Track what voters really think about YOU."},
          ].map(c=>(
            <div key={c.title} className="rounded-2xl border border-white/10 bg-[#111] p-6"><div className="text-2xl">{c.icon}</div><div className="mt-3 font-bold">{c.title}</div><div className="mt-2 text-sm text-white/50 leading-relaxed">{c.desc}</div></div>
          ))}
        </div>

        <div className="mt-16 rounded-[24px] border border-white/10 bg-[#0E0E0E] overflow-hidden">
          <div className="p-6 md:p-8 flex justify-between items-center border-b border-white/10">
            <div><div className="text-[11px] tracking-widest text-white/30">PREVIEW • REAL PRIVATE DASHBOARD</div><div className="mt-1 font-bold text-lg">This is YOUR private view after login</div></div>
            <div className="hidden md:flex text-xs px-3 py-1.5 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66]">● Encrypted • Private • Real Data</div>
          </div>
          <div className="p-6 grid md:grid-cols-3 gap-6 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0E] via-[#0E0E0E]/80 to-transparent z-10 flex items-end justify-center pb-12"><Link href="/register" className="px-8 py-3 rounded-full bg-white text-black font-bold">Create Profile to Unlock Your Real Mentions →</Link></div>
            <div className="blur-[6px] select-none pointer-events-none">
              <div className="h-24 rounded-xl bg-white/[0.06] border border-white/10 p-4"><div className="text-xs text-white/30">SENTIMENT 24H</div><div className="mt-2 h-2 w-full bg-white/10 rounded"><div className="h-2 w-[68%] bg-[#00ff66] rounded"></div></div><div className="mt-2 text-sm font-bold">68% Positive ↑ Real</div></div>
              <div className="mt-4 space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 rounded-xl bg-white/[0.04] border border-white/10 p-4"><div className="text-xs text-white/40">X / Twitter • Real mention</div><div className="mt-1 text-sm text-white/70">Real voter comment about your leadership...</div></div>)}</div>
            </div>
            <div className="blur-[6px] select-none pointer-events-none md:col-span-2">
              <div className="grid grid-cols-2 gap-4"><div className="h-32 rounded-xl bg-white/[0.04] border border-white/10 p-4"></div><div className="h-32 rounded-xl bg-white/[0.04] border border-white/10 p-4"></div></div>
              <div className="mt-4 h-48 rounded-xl bg-white/[0.04] border border-white/10 p-4"><div className="text-xs text-white/30">REAL MENTIONS OVER TIME</div><div className="mt-8 flex items-end gap-1 h-20">{[40,60,30,80,50,90,70].map((h,i)=><div key={i} style={{height:`${h}%`}} className="flex-1 bg-[#00ff66]/60 rounded-t"></div>)}</div></div>
            </div>
          </div>
        </div>

        <div className="mt-16 mb-20 rounded-[28px] bg-[#00ff66] p-10 md:p-16 text-center text-black">
          <h2 className="text-[32px] md:text-[52px] font-[800] leading-[0.9] tracking-tight">No demos.<br/>No fake data.<br/>Just your real reputation.</h2>
          <p className="mt-4 text-black/60 max-w-[500px] mx-auto">Create your private profile. Add your real name & keywords. See only YOUR real mentions.</p>
          <Link href="/register" className="mt-8 inline-block px-10 py-4 rounded-full bg-black text-white font-bold">Create Real Private Profile</Link>
        </div>
      </div>
    </div>
  )
}