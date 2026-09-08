"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AuthPage(){
  const router = useRouter()
  const [mode,setMode]=useState<"signup"|"login">("signup")
  const [loading,setLoading]=useState(false)
  const [showSuccess,setShowSuccess]=useState(false)
  const [form,setForm]=useState({ name:"", email:"", phone:"", position:"MP", county:"Nairobi", password:"", confirm:"" })
  const [error,setError]=useState("")

  const handleSignup = async ()=>{
    if(form.name.length<3){ setError("Name min 3"); return }
    if(form.password.length<6){ setError("Password min 6"); return }
    if(form.password!==form.confirm){ setError("Passwords mismatch"); return }
    setLoading(true); setError("")
    try{
      const res = await fetch("/api/create-user",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(form) })
      const j = await res.json()
      if(!res.ok) throw new Error(j.error)
      setShowSuccess(true)
      setTimeout(()=>router.push("/dashboard"),2000)
    }catch(e:any){ setError(e.message) }
    setLoading(false)
  }

  const handleLogin = async ()=>{
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    setLoading(true); setError("")
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if(error) setError(error.message)
    else router.push("/dashboard")
    setLoading(false)
  }

  if(showSuccess) return (<div className="min-h-screen bg-black flex items-center justify-center text-white"><div className="text-center"><div className="text-[80px] animate-bounce">🎉</div><div className="w-28 h-28 mx-auto rounded-full bg-[#00ff66] flex items-center justify-center text-black text-[40px] font-black">{form.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div><h1 className="text-3xl font-black mt-6">Welcome {form.name.split(" ")[0]}!</h1><p className="text-white/60">Private profile ready!</p></div></div>)

  return(
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-[440px]">
        <h1 className="text-[36px] font-black leading-[0.9]">{mode==="signup"?"Create private profile":"Login"}</h1>
        <div className="mt-6 space-y-3">
          {mode==="signup"&&<><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full Name" className="w-full px-5 py-3.5 rounded-full bg-white/10 border border-white/10 outline-none"/><div className="grid grid-cols-2 gap-3"><select value={form.position} onChange={e=>setForm({...form,position:e.target.value})} className="px-5 py-3.5 rounded-full bg-[#111] border border-white/10"><option>MP</option><option>Senator</option><option>Governor</option><option>MCA</option><option>Woman Rep</option></select><select value={form.county} onChange={e=>setForm({...form,county:e.target.value})} className="px-5 py-3.5 rounded-full bg-[#111] border border-white/10">{["Nairobi","Bomet","Kericho","Nakuru","Kiambu","Mombasa"].map(c=><option key={c}>{c}</option>)}</select></div><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone" className="w-full px-5 py-3.5 rounded-full bg-white/10 border border-white/10 outline-none"/></>}
          <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email" className="w-full px-5 py-3.5 rounded-full bg-white/10 border border-white/10 outline-none"/>
          <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Password" className="w-full px-5 py-3.5 rounded-full bg-white/10 border border-white/10 outline-none"/>
          {mode==="signup"&&<input type="password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} placeholder="Confirm Password" className="w-full px-5 py-3.5 rounded-full bg-white/10 border border-white/10 outline-none"/>}
          {error&&<div className="text-xs p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">{error}</div>}
          <button onClick={mode==="signup"?handleSignup:handleLogin} disabled={loading} className="w-full py-4 rounded-full bg-[#00ff66] text-black font-bold">{loading?"Wait...":mode==="signup"?"Create Private Profile →":"Login →"}</button>
          <div className="text-center text-sm text-white/40">{mode==="signup"?<><span>Have account? </span><button onClick={()=>setMode("login")} className="text-[#00ff66]">Login</button></>:<><span>No account? </span><button onClick={()=>setMode("signup")} className="text-[#00ff66]">Create</button></>}</div>
        </div>
      </div>
    </div>
  )
}
