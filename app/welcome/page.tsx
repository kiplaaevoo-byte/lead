"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Welcome(){
  const router = useRouter()
  const [name,setName]=useState("there")

  useEffect(()=>{
    const check = async ()=>{
      const { data } = await supabase.auth.getSession()
      if(!data.session){
        router.push("/login")
        return
      }
      const user = data.session.user
      setName(user.email?.split("@")[0] || "there")
      // small delay so user sees welcome, then go dashboard
      setTimeout(()=> router.push("/dashboard"), 1500)
    }
    check()
  },[router])

  return(
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-4xl font-bold animate-pulse">Welcome {name} 🎉</h1>
        <p className="mt-4 opacity-60">Redirecting to your dashboard...</p>
        <div className="mt-6 w-32 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-[#00ff66] animate-[shimmer_1.5s_linear_infinite] w-full"></div>
        </div>
      </div>
    </div>
  )
}