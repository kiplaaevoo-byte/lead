"use client"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Login(){
  const [phone,setPhone]=useState("0758973109")
  const [password,setPassword]=useState("")
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState("")

  const login = async (e:any)=>{
    e.preventDefault()
    setLoading(true)
    setMsg("Checking REAL account...")
    try{
      const {data: pol, error} = await supabase
      .from("politicians")
      .select("*")
      .eq("phone", phone.trim())
      .maybeSingle()

      console.log("pol", pol, error)
      if(error) throw new Error(error.message)
      if(!pol){ setMsg(`❌ No account for ${phone}. Register first`); setLoading(false); return }

      if(!pol.password_hash){ setMsg("❌ No password set. Re-register"); setLoading(false); return }

      const ok = await bcrypt.compare(password, pol.password_hash)
      if(!ok){ setMsg("❌ Wrong password"); setLoading(false); return }

      localStorage.setItem("siasa_user_id", pol.id)
      localStorage.setItem("siasa_phone", pol.phone)
      localStorage.setItem("siasa_name", pol.name)
      localStorage.setItem("siasa_county", pol.county)
      setMsg(`✅ Welcome ${pol.name}! Redirecting to REAL dashboard...`)

      setTimeout(()=>{ window.location.href = "/dashboard" }, 800)

    }catch(err:any){
      setMsg("❌ Error: " + err.message)
      setLoading(false)
    }
  }

  return(
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <form onSubmit={login} className="w-full max-w-[400px] bg-[#111] border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold">Login REAL Account</h1>
        <p className="text-sm text-white/50 mt-1">Private • Encrypted • {phone}</p>
        <input className="mt-6 w-full px-4 py-3 rounded-xl bg-black border border-white/10" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="0758973109"/>
        <input type="password" required className="mt-3 w-full px-4 py-3 rounded-xl bg-black border border-white/10" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/>
        <button disabled={loading} className="mt-6 w-full py-3.5 rounded-xl bg-[#00ff66] text-black font-bold">{loading? "Checking..." : "Login → REAL Dashboard"}</button>
        {msg && <div className="mt-4 text-sm p-3 rounded-xl bg-white/10 border border-white/10">{msg}</div>}
        <div className="mt-4 text-center text-sm text-white/40">No account? <Link href="/register" className="text-[#00ff66] underline">Create REAL Profile</Link></div>
      </form>
    </div>
  )
}