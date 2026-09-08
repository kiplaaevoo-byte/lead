"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function PoliticianPage({params}:{params:{id:string}}){
  const [pol,setPol]=useState<any>(null)
  const [mentions,setMentions]=useState<any[]>([])
  useEffect(()=>{
    async function load(){
      const {data:p} = await supabase.from("politicians").select("*").eq("id", params.id).single()
      setPol(p)
      const {data:m} = await supabase.from("mentions").select("*").eq("politician_id", params.id).order("created_at",{ascending:false}).limit(100)
      setMentions(m||[])
    }
    load()
    const i=setInterval(load,60000)
    return ()=>clearInterval(i)
  },[])
  if(!pol) return <div className="min-h-screen bg-black text-white p-10">Loading live feed...</div>
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-800 p-6 flex justify-between items-center">
        <Link href="/" className="text-xs text-zinc-500 hover:text-white">← Back</Link>
        <button onClick={()=>fetch("/api/scan",{method:"POST",body:JSON.stringify({politician_id:params.id})})} className="bg-white text-black px-4 py-2 rounded-full text-xs font-black">SCAN NOW</button>
      </div>
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-5xl font-black tracking-tighter">{pol.name}</h1>
        <p className="text-zinc-500 text-sm mt-2">{pol.position} • {pol.county} • LIVE 60s refresh</p>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            {mentions.map((m:any)=>(
              <div key={m.id} className="border border-zinc-800 bg-zinc-900/50 p-5 rounded-xl">
                <div className="flex justify-between text-[10px] uppercase text-zinc-500"><span>{m.platform}</span><span className={m.sentiment=="positive"?"text-green-400":m.sentiment=="negative"?"text-red-400":"text-yellow-400"}>{m.sentiment}</span></div>
                <p className="mt-3 text-sm text-zinc-200">{m.content}</p>
              </div>
            ))}
          </div>
          <div className="border border-zinc-800 rounded-2xl p-6 bg-zinc-900 h-fit">
            <div className="text-[10px] uppercase text-zinc-500 tracking-widest">Tracking</div>
            <div className="flex flex-wrap gap-2 mt-3">{pol.keywords?.map((k:string)=><span key={k} className="text-[10px] px-2 py-1 bg-black border border-zinc-800 rounded-full">{k}</span>)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
