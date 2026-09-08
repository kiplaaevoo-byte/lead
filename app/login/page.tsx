"use client"
import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function LoginPage(){
  const router = useRouter()
  const [mode,setMode] = useState<"login"|"signup">("signup")
  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")
  const [name,setName]=useState("")
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState("")

  const handleAuth = async ()=>{
    setLoading(true); setMsg("")
    try{
      if(mode==="signup"){
        const { data, error } = await supabase.auth.signUp({ email, password })
        if(error) throw error
        if(data.user){
          await supabase.from("politicians").insert({ name: name || email.split("@")[0], user_id: data.user.id, keywords: [name] })
          setMsg("✅ Profile created! Now login.")
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
          <p className="mt-3 text-sm text-white/50">Only you will see your mentions. 100% private.</p>
          <div className="mt-8 space-y-4">
            {mode==="signup" && <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your Full Name" className="w-full px-5 py-3.5 rounded-full bg-white/[0.06] border border-white/10 outline-none" />}
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full px-5 py-3.5 rounded-full bg-white/[0.06] border border-white/10 outline-none" />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full px-5 py-3.5 rounded-full bg-white/[0.06] border border-white/10 outline-none" />
            <button onClick={handleAuth} disabled={loading} className="w-full py-4 rounded-full bg-[#00ff66] text-black font-bold">{loading? "Please wait..." : mode==="signup"? "Create Private Profile →" : "Login →"}</button>
            {msg && <div className="text-xs p-3 rounded-xl bg-white/[0.06] border border-white/10">{msg}</div>}
            <div className="text-center text-sm text-white/40 pt-4">{mode==="signup"? <><span>Already have profile? </span><button onClick={()=>setMode("login")} className="text-[#00ff66] underline">Login</button></> : <><span>No profile? </span><button onClick={()=>setMode("signup")} className="text-[#00ff66] underline">Create one</button></>}</div>
          </div>
          <div className="mt-12 text-[11px] text-white/20">🔒 PRIVATE BY DESIGN: No public leaderboard. No other politician can see your data.</div>
        </div>
      </div>
      <div className="hidden md:flex w-[52%] bg-[#0E0E0E] border-l border-white/10 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00ff66]/20 blur-[150px] rounded-full"></div>
        <div className="relative z-10"><div className="text-[11px] tracking-widest text-[#00ff66]">● LIVE PRIVATE DASHBOARD</div><h2 className="mt-4 text-[40px] font-extrabold leading-[0.9]">Your reputation,<br/>monitored privately.</h2></div>
      </div>
    </div>
  )
}
