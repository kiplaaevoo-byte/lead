"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Login(){
  const [form, setForm] = useState({phone:"", password:""})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e:any)=>{
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/login",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form)})
    const data = await res.json()
    setLoading(false)
    if(res.ok){ router.push("/dashboard") }
    else{ alert(data.error) }
  }

  return(
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-[400px] bg-[#111] border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold">Login to Private Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">Only your data. No public lists.</p>
        <input required placeholder="Phone" className="mt-6 w-full px-4 py-3 rounded-xl bg-black border border-white/10" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})}/>
        <input required type="password" placeholder="Password" className="mt-3 w-full px-4 py-3 rounded-xl bg-black border border-white/10" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
        <button disabled={loading} className="mt-6 w-full py-3.5 rounded-xl bg-white text-black font-bold">{loading? "Logging in..." : "Login →"}</button>
        <div className="mt-4 text-center text-sm text-white/40">No account? <Link href="/register" className="text-[#00ff66] underline">Create Profile</Link></div>
      </form>
    </div>
  )
}