"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function Page() {
  const [mentions, setMentions] = useState(14)

  useEffect(()=>{
    const i = setInterval(()=> setMentions(m=>m+1), 3000)
    return ()=>clearInterval(i)
  },[])

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-[#00ff66]/30">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;600;800&display=swap'); *{font-family:'Geist',sans-serif}`}</style>

      {/* NAV */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/[0.08]">
        <div className="max-w-[1280px] mx-auto px-6 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-black">P</div>
            <span className="font-extrabold tracking-tight text-[16px]">POLITICAL TRACKER<span className="text-[#00ff66]">.KE</span></span>
            <span className="ml-3 text-[10px] tracking-widest px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/10">LIVE SCANNING • {mentions} MENTIONS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:block text-sm px-5 py-2.5 rounded-full border border-[#00ff66]/50 hover:bg-[#00ff66]/10 transition">Login</Link>
            <Link href="/login?mode=signup" className="text-sm font-bold px-6 py-2.5 rounded-full bg-[#00ff66] text-black hover:bg-[#33ff88] shadow-[0_0_30px_rgba(0,255,102,0.4)] transition">Create Profile →</Link>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-[1280px] mx-auto px-6 pt-16 md:pt-24 pb-12">
        <div className="inline-flex items-center gap-2 text-[11px] tracking-widest border border-[#00ff66]/30 bg-[#00ff66]/10 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 bg-[#00ff66] rounded-full animate-pulse"></span> LIVE MONITORING • AUTO-SCAN 15MIN • KENYA
        </div>

        <h1 className="text-[42px] md:text-[84px] font-[800] leading-[0.9] tracking-[-0.04em] max-w-[900px]">
          We track what<br/>
          <span className="text-white/30">social media says</span><br/>
          about you — <span className="text-[#00ff66]">LIVE.</span>
        </h1>

        <p className="mt-6 text-[16px] md:text-[18px] text-white/60 max-w-[620px] leading-relaxed">
          Real-time intelligence for Kenyan leaders. We scan X, Facebook, Instagram, TikTok & YouTube every 15 minutes. Know your sentiment before your opponent does.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 items-center">
          <Link href="/login?mode=signup" className="px-8 py-4 rounded-full bg-[#00ff66] text-black font-bold text-[16px] shadow-[0_0_40px_rgba(0,255,102,0.5)] hover:scale-[1.02] transition">Create Your Profile — It's Free</Link>
          <Link href="/login" className="px-8 py-4 rounded-full border border-white/15 bg-white/[0.04] font-semibold hover:bg-white/[0.08] transition">Login to Dashboard</Link>
          <span className="text-xs text-white/40 ml-2">✓ No credit card • 2-min setup</span>
        </div>

        {/* SOCIAL PROOF BAR */}
        <div className="mt-12 flex flex-wrap gap-2 text-[11px]">
          {['14 MENTIONS LIVE','FACEBOOK ✓','INSTAGRAM ✓','THREADS ✓','X / TWITTER ✓','TIKTOK ✓','YOUTUBE ✓'].map(b=>(
            <span key={b} className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10">{b}</span>
          ))}
          <span className="px-3 py-1.5 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66]">● AUTO-SCAN ACTIVE</span>
        </div>

        {/* STATS */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {k:"14k+", v:"Mentions tracked (24h)", sub:"↑ 12% today"},
            {k:"200+", v:"Leaders monitored", sub:"Parliament + County"},
            {k:"3.2s", v:"Avg scan latency", sub:"Real-time API"},
          ].map(s=>(
            <div key={s.k} className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 backdrop-blur">
              <div className="text-[36px] font-extrabold text-[#00ff66]">{s.k}</div>
              <div className="text-sm text-white/70">{s.v}</div>
              <div className="text-[11px] text-[#00ff66]/70 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* POLITICIAN GRID - LIVE */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Live Leader Insights <span className="text-white/40 font-normal text-sm ml-2">Updates every 15 min</span></h2>
            <span className="text-xs px-3 py-1 rounded-full bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/20">Now tracking: #FinanceBill2024 • #Nairobi</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {name:"HON WILLIAM KIPCHIRCHIR SAMOEI RUTO", sentiment:"POSITIVE ↑ 8.2%", mentions:"1.2k", color:"border-[#00ff66]/40"},
              {name:"HON ISAAC KIPRONO RUTO", sentiment:"54% NEUTRAL", mentions:"2.4k", color:"border-white/10"},
              {name:"HON. PETER MUTAI", sentiment:"POSITIVE ↑ 12%", mentions:"980", color:"border-[#00ff66]/40"},
              {name:"HON BENARD NGENO", sentiment:"NEGATIVE ↓ 3%", mentions:"432", color:"border-red-500/20"},
              {name:"HON. VICTOR KIPKOECH MANDAZI", sentiment:"POSITIVE ↑ 5%", mentions:"1.8k", color:"border-[#00ff66]/40"},
              {name:"Hon WAKILI SIGEI", sentiment:"NEUTRAL", mentions:"650", color:"border-white/10"},
            ].map(p=>(
              <Link key={p.name} href="/login?mode=signup" className={`group rounded-2xl border ${p.color} bg-[#111] p-5 hover:bg-[#161616] hover:scale-[1.01] transition-all`}>
                <div className="flex justify-between items-start">
                  <div className="text-[10px] tracking-widest text-white/30">LEADER • ALL PLATFORMS</div>
                  <div className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse"></div>
                </div>
                <div className="mt-4 font-bold leading-tight text-[15px]">{p.name}</div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-[11px] text-white/50">{p.sentiment} • {p.mentions} • Last 24h</div>
                  <div className="text-[11px] group-hover:text-[#00ff66] transition">View live mentions →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-20 rounded-[24px] border border-[#00ff66]/20 bg-gradient-to-br from-[#00ff66]/15 to-black p-10 md:p-14 text-center">
          <h3 className="text-[32px] md:text-[48px] font-extrabold leading-[0.95] tracking-tight">Ready to own the narrative?</h3>
          <p className="mt-4 text-white/60 max-w-[600px] mx-auto">Join 200+ Kenyan leaders who track public opinion in real-time. Create your profile in 2 minutes.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/login?mode=signup" className="px-8 py-4 rounded-full bg-white text-black font-bold">Create Profile Free</Link>
            <Link href="/login" className="px-8 py-4 rounded-full border border-white/20">Login</Link>
          </div>
        </div>

        <div className="mt-12 text-center text-[11px] text-white/20 tracking-widest">TRACKING FACEBOOK • INSTAGRAM • THREADS • X • TIKTOK • YOUTUBE — REAL TIME • BUILT FOR KENYA</div>
      </div>
    </div>
  )
}
