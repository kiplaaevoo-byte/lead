"use client"
import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

function LoginInner(){
  const searchParams = useSearchParams()
  const router = useRouter()
  const preEmail = searchParams.get("email") || ""
  const [email,setEmail]=useState(preEmail)
  const [password,setPassword]=useState("")
  const [show,setShow]=useState(false)
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState("")

  const login = async (e:any)=>{
    e.preventDefault()
    setLoading(true); setMsg("")
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if(error){ setMsg("❌ "+error.message); setLoading(false); return }
    if(data.session){
      router.push("/welcome")
    } else {
      setMsg("Check your email to confirm account first")
      setLoading(false)
    }
  }
  return(
    <form onSubmit={login} className="w-full max-w-[400px] bg-[#111] border border-white/10 rounded-2xl p-8">
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="text-sm opacity-60 mt-2">Welcome back to Lead</p>
      <input required type="email" className="mt-6 w-full px-4 py-3 rounded-xl bg-black border border-white/10 outline-none focus:border-[#00ff66]" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
      <div className="relative mt-3">
        <input required type={show?"text":"password"} className="w-full px-4 py-3 rounded-xl bg-black border border-white/10 outline-none focus:border-[#00ff66]" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/>
        <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-3.5 text-xs opacity-50">{show?"Hide":"Show"}</button>
      </div>
      <button disabled={loading} className="mt-6 w-full py-3.5 rounded-xl bg-[#00ff66] text-black font-bold disabled:opacity-50">{loading?"Signing in...":"Login →"}</button>
      {msg && <div className="mt-4 text-sm p-3 rounded-xl bg-white/10 border border-white/10">{msg}</div>}
      <div className="mt-4 flex justify-between text-sm opacity-60"><Link href="/register" className="underline text-white">No account? Register</Link></div>
    </form>
  )
}

export default function LoginPage(){
  return(
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <Suspense fallback={<div>Loading...</div>}><LoginInner/></Suspense>
    </div>
  )
}