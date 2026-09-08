"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter, useSearchParams } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function LoginPage(){
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode,setMode] = useState<"login"|"signup">("login")
  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")
  const [name,setName]=useState("")
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState("")

  useEffect(()=>{
    if(searchParams.get("mode")==="signup") setMode("signup")
  },[searchParams])

  const handleAuth = async ()=>{
    setLoading(true); setMsg("")
    try{
      if(mode==="signup"){
        const { data, error } = await supabase.auth.signUp({ email, password })
        if(error) throw error
        if(data.user){
          // create politician profile linked to user
          await supabase.from("politicians").insert({ name: name || email.split("@")[0], user_id: data.user.id, keywords: [name] })
          setMsg("✅ Profile created! Check email to confirm, then login.")
          setMode("login")
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if(error) throw error
        router.push("/dashboard")
      }
    }catch(e:any){ setMsg("❌ "+e.message) }
    setLoading(false)
  }

  return(
    <div className="min-h-screen bg-[#050505] text-white flex">
      <div className="w-full md:w-[48%] p-8 md:p-16 flex flex-col justify-center">
        <div className="max-w-[400px] w-full mx-auto">
          <div className="flex items-center gap-2 mb-12"><div className="w-8 h-8 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-black">P</div><span className="font-black">POLITICAL TRACKER.KE</span></div>

          <h1 className="text-[36px] font-extrabold leading-[0.9] tracking-tight">{mode==="signup"? "Create your private profile" : "Login to your private dashboard"}</h1>
          <p className="mt-3 text-sm text-white/50">{mode==="signup"? "Only you will see your mentions. 100% private & encrypted." : "Your mentions are private and encrypted."}</p>

          <div className="mt-8 space-y-4">
            {mode==="signup" && <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your Full Name (e.g. Hon. John Doe)" className="w-full px-5 py-3.5 rounded-full bg-white/[0.06] border border-white/10 outline-none focus:border-[#00ff66]/50" />}
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full px-5 py-3.5 rounded-full bg-white/[0.06] border border-white/10 outline-none focus:border-[#00ff66]/50" />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full px-5 py-3.5 rounded-full bg-white/[0.06] border border-white/10 outline-none focus:border-[#00ff66]/50" />

            <button onClick={handleAuth} disabled={loading} className="w-full py-4 rounded-full bg-[#00ff66] text-black font-bold hover:bg-[#33ff88] transition disabled:opacity-50">
              {loading? "Please wait..." : mode==="signup"? "Create Private Profile →" : "Login →"}
            </button>

            {msg && <div className="text-xs p-3 rounded-xl bg-white/[0.06] border border-white/10">{msg}</div>}

            <div className="text-center text-sm text-white/40 pt-4">
              {mode==="signup"? <>Already have profile? <button onClick={()=>setMode("login")} className="text-[#00ff66] underline">Login</button></> : <>No profile? <button onClick={()=>setMode("signup")} className="text-[#00ff66] underline">Create one</button></>}
            </div>
          </div>

          <div className="mt-12 text-[11px] text-white/20 leading-relaxed">🔒 PRIVATE BY DESIGN: Your data is isolated. No public leaderboard. No other politician can see your mentions. Encrypted at rest.</div>
        </div>
      </div>

      <div className="hidden md:flex w-[52%] bg-[#0E0E0E] border-l border-white/10 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00ff66]/20 blur-[150px] rounded-full"></div>
        <div className="relative z-10">
          <div className="text-[11px] tracking-widest text-[#00ff66]">● LIVE PRIVATE DASHBOARD PREVIEW</div>
          <h2 className="mt-4 text-[40px] font-extrabold leading-[0.9]">Your reputation,<br/>monitored privately.</h2>
          <div className="mt-8 space-y-3">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex justify-between"><span className="text-sm text-white/60">Mentions last 24h</span><span className="text-[#00ff66] font-bold">1,283 private</span></div>
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex justify-between"><span className="text-sm text-white/60">Sentiment</span><span className="text-white font-bold">68% Positive</span></div>
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white/50">Recent: "Hon. John doing great work in Bomet..." • X • 2h ago (only you see this)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
