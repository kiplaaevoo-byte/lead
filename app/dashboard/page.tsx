"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function Dashboard(){
  const router = useRouter()
  const [loading,setLoading]=useState(true)
  const [email,setEmail]=useState("")

  useEffect(()=>{
    const getUser = async ()=>{
      const { data, error } = await supabase.auth.getSession()
      if(error ||!data.session){
        router.push("/login")
        return
      }
      setEmail(data.session.user.email || "")
      setLoading(false)
    }
    getUser()

    // listen for logout
    const { data: listener } = supabase.auth.onAuthStateChange((event, session)=>{
      if(event === "SIGNED_OUT" ||!session){
        router.push("/login")
      }
    })
    return ()=> listener.subscription.unsubscribe()
  },[router])

  const logout = async ()=>{
    await supabase.auth.signOut()
    router.push("/login")
  }

  if(loading){
    return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Loading dashboard...</div>
  }

  return(
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-3 items-center">
          <span className="text-sm opacity-60">{email}</span>
          <button onClick={logout} className="px-4 py-2 rounded-xl bg-white/10 text-sm">Logout</button>
        </div>
      </div>
      <div className="max-w-5xl mx-auto mt-8 grid gap-4">
        <div className="p-6 rounded-2xl bg-[#111] border border-white/10">
          <h2 className="font-bold">Welcome to Lead Tracker</h2>
          <p className="opacity-60 text-sm mt-2">Your political tracking starts here. Add politicians to monitor.</p>
          <Link href="/" className="mt-4 inline-block px-4 py-2 rounded-xl bg-[#00ff66] text-black font-bold text-sm">Explore →</Link>
        </div>
      </div>
    </div>
  )
}