"use client"
import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function AuthPage(){
  const router = useRouter()
  const [mode,setMode]=useState<"signup"|"login">("signup")
  const [loading,setLoading]=useState(false)
  const [showSuccess,setShowSuccess]=useState(false)
  const [form,setForm]=useState({ name:"", email:"", phone:"", position:"MP", county:"Nairobi", password:"", confirm:"" })
  const [error,setError]=useState("")

  const validate = ()=>{
    if(!form.name.trim() || form.name.length<3) return "Enter your full official name (min 3 chars)"
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter valid email"
    if(form.password.length<6) return "Password min 6 characters"
    if(mode==="signup" && form.password!==form.confirm) return "Passwords do not match"
    return ""
  }

  const handleSignup = async ()=>{
    const v = validate()
    if(v){ setError(v); return }
    setLoading(true); setError("")
    try{
      const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password })
      if(error) throw error
      if(data.user){
        const { error: pError } = await supabase.from("politicians").insert({
          name: form.name,
          user_id: data.user.id,
          position: form.position,
          county: form.county,
          phone: form.phone,
          email: form.email
        })
        if(pError) throw pError
        setShowSuccess(true)
        setTimeout(()=>{ setShowSuccess(false); setMode("login"); }, 3500)
      }
    }catch(e:any){ setError(e.message) }
    setLoading(false)
  }

  const handleLogin = async ()=>{
    if(!form.email ||!form.password){ setError("Enter email & password"); return }
    setLoading(true); setError("")
    try{
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if(error) throw error
      router.push("/dashboard")
    }catch(e:any){ setError(e.message) }
    setLoading(false)
  }

  if(showSuccess) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white p-6">
      <div className="text-center max-w-[420px]">
        <div className="text-[80px] animate-bounce">🎉</div>
        <div className="mt-4 mx-auto w-28 h-28 rounded-full bg-[#00ff66] flex items-center justify-center text-black text-[40px] font-black animate-[ping_1s_ease-in-out_1]">{form.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
        <h1 className="mt-6 text-[32px] font-extrabold">Welcome, {form.name.split(" ")[0]}!</h1>
        <p className="mt-2 text-white/60">Your private profile is created. We will start tracking your mentions now.</p>
        <div className="mt-6 inline-flex px-4 py-2 rounded-full bg-[#00ff66]/15 border border-[#00ff66]/20 text-[#00ff66] text-xs">🔒 Private • Encrypted • Only you can see it</div>
        <div className="mt-8 text-xs text-white/30">Redirecting to login...</div>
      </div>
      <style>{`@keyframes ping{0%{transform:scale(0.8)}50%{transform:scale(1.1)}100%{transform:scale(1)}}`}</style>
    </div>
  )

  return(
    <div className="min-h-screen bg-[#050505] text-white flex">
      <div className="w-full md:w-[52%] p-6 md:p-12 flex flex-col justify-center">
        <div className="max-w-[460px] w-full mx-auto">
          <div className="flex items-center gap-2 mb-8"><div className="w-8 h-8 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-black">P</div><span className="font-black">POLITICAL TRACKER.KE</span><span className="ml-2 text-[10px] px-2 py-1 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66]">PRIVATE</span></div>

          <h1 className="text-[34px] md:text-[42px] font-[800] leading-[0.9] tracking-tight">{mode==="signup"? "Create your private intelligence profile" : "Welcome back"}</h1>
          <p className="mt-3 text-[14px] text-white/50">{mode==="signup"? "Professional setup for MPs, Governors, Senators, MCAs. Takes 60 seconds." : "Login to see only YOUR mentions."}</p>

          <div className="mt-8 space-y-4">
            {mode==="signup" && <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full Official Name *" className="px-5 py-3.5 rounded-2xl bg-white/[0.06] border border-white/10 outline-none focus:border-[#00ff66]/50" />
                <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone (07...)" className="px-5 py-3.5 rounded-2xl bg-white/[0.06] border border-white/10 outline-none focus:border-[#00ff66]/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.position} onChange={e=>setForm({...form,position:e.target.value})} className="px-5 py-3.5 rounded-2xl bg-[#111] border border-white/10 outline-none">
                  <option>MP</option><option>Senator</option><option>Governor</option><option>MCA</option><option>Woman Rep</option><option>Other Leader</option>
                </select>
                <select value={form.county} onChange={e=>setForm({...form,county:e.target.value})} className="px-5 py-3.5 rounded-2xl bg-[#111] border border-white/10 outline-none">
                  {["Nairobi","Mombasa","Kiambu","Bomet","Kericho","Nakuru","Kisumu","Uasin Gishu","Machakos","Kakamega","Other"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </>}

            <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Official Email *" className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.06] border border-white/10 outline-none focus:border-[#00ff66]/50" />
            <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Password (min 6 chars) *" className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.06] border border-white/10 outline-none" />
            {mode==="signup" && <input type="password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} placeholder="Confirm Password *" className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.06] border border-white/10 outline-none" />}

            {error && <div className="text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}

            <button onClick={mode==="signup"? handleSignup : handleLogin} disabled={loading} className="w-full py-4 rounded-full bg-[#00ff66] text-black font-bold text-[15px] hover:bg-[#33ff88] shadow-[0_0_30px_rgba(0,255,102,0.3)] disabled:opacity-50">
              {loading? "Processing..." : mode==="signup"? "Create Private Profile →" : "Login to Dashboard →"}
            </button>

            <div className="flex items-center gap-2 text-[11px] text-white/30"><div className="h-px flex-1 bg-white/10"></div>SECURE & ENCRYPTED<div className="h-px flex-1 bg-white/10"></div></div>

            <div className="text-center text-sm text-white/40">
              {mode==="signup"? <>Already have account? <button onClick={()=>setMode("login")} className="text-[#00ff66] font-semibold">Login</button></> : <>No account? <button onClick={()=>setMode("signup")} className="text-[#00ff66] font-semibold">Create private profile</button></>}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3 text-[11px]">
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">🔒 Private by default</div>
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">⚡ Live scan 15min</div>
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">📊 Your sentiment only</div>
          </div>
        </div>
      </div>

      <div className="hidden md:flex w-[48%] bg-[#0E0E0E] border-l border-white/10 p-10 flex-col justify-center relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-[700px] h-[700px] bg-[#00ff66]/15 blur-[140px] rounded-full"></div>
        <div className="relative z-10 max-w-[420px]">
          <div className="w-16 h-16 rounded-2xl bg-[#00ff66] flex items-center justify-center text-black text-2xl">🔒</div>
          <h2 className="mt-6 text-[38px] font-extrabold leading-[0.9]">Trusted by leaders across Kenya</h2>
          <ul className="mt-6 space-y-3 text-sm text-white/60">
            <li>✓ No public leaderboard — 100% confidential</li>
            <li>✓ Tracks X, Facebook, Instagram, TikTok, YouTube</li>
            <li>✓ Instant alerts on negative mentions</li>
            <li>✓ Used by MPs, Governors, MCAs</li>
          </ul>
          <div className="mt-10 p-5 rounded-2xl bg-[#00ff66]/10 border border-[#00ff66]/20">
            <div className="text-xs text-[#00ff66]">WHAT YOU GET AFTER SIGNUP</div>
            <div className="mt-2 text-sm">Private dashboard • Live sentiment • Mentions feed • County trends • PDF reports</div>
          </div>
        </div>
      </div>
    </div>
  )
}
