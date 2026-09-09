"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Register(){
  const router = useRouter()
  const [loading,setLoading]=useState(false)
  const [user,setUser]=useState<any>(null)
  const [fullName,setFullName]=useState("")

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      if(!data.session){ router.replace("/login") } else { setUser(data.session.user) }
    })
  },[router])

  const handleRegister = async (e:any)=>{
    e.preventDefault()
    if(!user) return
    setLoading(true)

    const res = await fetch("/api/register",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        user_id: user.id, // FIXES NULL LOOP
        full_name: fullName,
        email: user.email
      })
    })

    const json = await res.json()
    if(!res.ok){
      alert("Register failed: "+json.error)
      setLoading(false)
      return
    }

    router.replace("/welcome")
  }

  if(!user) return <main className="min-h-screen bg-black text-white flex items-center justify-center">Loading session...</main>

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-5">
      <form onSubmit={handleRegister} className="w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl p-7">
        <h1 className="text-2xl font-black">Create Profile</h1>
        <p className="text-xs text-white/40 mt-1">{user.email}</p>
        <input className="mt-5 w-full p-3 rounded-xl bg-black border border-white/10" placeholder="Full Name" value={fullName} onChange={e=>setFullName(e.target.value)} required />
        <button disabled={loading} className="mt-5 w-full p-3 rounded-xl bg-[#00ff66] text-black font-bold">
          {loading?"Creating...":"Create Profile →"}
        </button>
      </form>
    </main>
  )
}