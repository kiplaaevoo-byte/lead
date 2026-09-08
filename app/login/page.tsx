"use client"
import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
export default function AuthPage(){
  const router=useRouter()
  const [mode,setMode]=useState<"signup"|"login">("signup")
  const [loading,setLoading]=useState(false)
  const [showSuccess,setShowSuccess]=useState(false)
  const [form,setForm]=useState({ name:"", email:"", phone:"", position:"MP", county:"Nairobi", password:"", confirm:"" })
  const [error,setError]=useState("")
  const handleSignup=async()=>{
    if(form.name.length<3){setError("Name min 3 chars");return}
    if(form.password.length<6){setError("Password min 6");return}
    if(form.password!==form.confirm){setError("Passwords mismatch");return}
    setLoading(true);setError("")
    try{
      const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password })
      if(error) throw error
      if(data.user){
        const { error:pError } = await supabase.from("politicians").insert({ name: form.name, user_id: data.user.id, position: form.position, county: form.county, phone: form.phone, email: form.email })
        if(pError) throw pError
        setShowSuccess(true)
        setTimeout(()=>router.push("/login"),3000)
      }
    }catch(e:any){setError(e.message)} setLoading(false)
  }
  const handleLogin=async()=>{
    setLoading(true);setError("")
    try{ const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password }); if(error) throw error; router.push("/dashboard") }catch(e:any){setError(e.message)} setLoading(false)
  }
  if(showSuccess) return (<div className="min-h-screen bg-black flex items-center justify-center text-white"><div className="text-center"><div className="text-[80px] animate-bounce">🎉</div><h1 className="text-3xl font-black mt-4">Welcome {form.name}!</h1><p className="text-white/60 mt-2">Profile created privately!</p></div></div>)
  return(
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-[440px]">
        <h1 className="text-[36px] font-black">{mode==="signup"?"Create private profile":"Login"}</h1>
        <div className="mt-6 space-y-3">
          {mode==="signup"&&<><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full Name" className="w-full px-5 py-3.5 rounded-full bg-white/10 border border-white/10"/><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone" className="w-full px-5 py-3.5 rounded-full bg-white/10 border border-white/10"/></>}
          <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email" className="w-full px-5 py-3.5 rounded-full bg-white/10 border border-white/10"/>
          <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Password" className="w-full px-5 py-3.5 rounded-full bg-white/10 border border-white/10"/>
          {mode==="signup"&&<input type="password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} placeholder="Confirm Password" className="w-full px-5 py-3.5 rounded-full bg-white/10 border border-white/10"/>}
          {error&&<div className="text-xs p-3 rounded-xl bg-red-500/10 text-red-400">{error}</div>}
          <button onClick={mode==="signup"?handleSignup:handleLogin} disabled={loading} className="w-full py-4 rounded-full bg-[#00ff66] text-black font-bold">{loading?"Wait...":mode==="signup"?"Create →":"Login →"}</button>
          <div className="text-center text-sm text-white/40">{mode==="signup"?<><span>Have account? </span><button onClick={()=>setMode("login")} className="text-[#00ff66]">Login</button></>:<><span>No account? </span><button onClick={()=>setMode("signup")} className="text-[#00ff66]">Create</button></>}</div>
        </div>
      </div>
    </div>
  )
}
