"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function Admin(){
  const [pols,setPols]=useState<any[]>([])
  const [name,setName]=useState("")
  const [position,setPosition]=useState("")
  const [keywords,setKeywords]=useState("")

  async function load(){
    const {data}=await supabase.from("politicians").select("*").order("created_at",{ascending:false})
    setPols(data||[])
  }
  useEffect(()=>{load()},[])

  async function add(){
    if(!name) return alert("Name required")
    const kw = keywords.split(",").map(s=>s.trim()).filter(Boolean)
    const {error}=await supabase.from("politicians").insert({name, position, keywords: kw})
    if(error) alert(error.message)
    else { setName(""); setPosition(""); setKeywords(""); load() }
  }

  async function del(id:string){
    if(!confirm("Delete?")) return
    await supabase.from("politicians").delete().eq("id", id)
    load()
  }

  async function scanAll(){
    if(!confirm("Scan ALL socials for ALL politicians?")) return
    const res = await fetch("/api/scan",{method:"POST"})
    const j = await res.json()
    alert(j.message||"Scan started - check politicians pages")
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xs text-zinc-500">← Home</Link>
          <button onClick={scanAll} className="bg-green-500 text-black px-4 py-2 rounded-full text-xs font-black">SCAN ALL SOCIALS NOW</button>
        </div>
        <h1 className="text-4xl font-black mt-8 tracking-tighter">ADMIN — Add Politician</h1>
        
        <div className="mt-8 border border-zinc-800 p-6 rounded-2xl bg-zinc-900/50 space-y-3">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name e.g. William Ruto" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm"/>
          <input value={position} onChange={e=>setPosition(e.target.value)} placeholder="Position e.g. President" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm"/>
          <input value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="Keywords comma separated e.g. ruto, president, zakayo" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm"/>
          <button onClick={add} className="w-full bg-white text-black font-black py-3 rounded-xl text-sm">ADD + START TRACKING ALL SOCIALS</button>
          <p className="text-[10px] text-zinc-500">We will track Facebook, Instagram, Threads, X, TikTok for these keywords</p>
        </div>

        <div className="mt-10 space-y-2">
          {pols.map(p=>(
            <div key={p.id} className="flex justify-between items-center border border-zinc-800 p-4 rounded-xl">
              <div><div className="font-bold text-sm">{p.name}</div><div className="text-[11px] text-zinc-500">{p.position} • {p.keywords?.join(", ")}</div></div>
              <div className="flex gap-2">
                <Link href={`/politician/${p.id}`} className="text-xs bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">View</Link>
                <button onClick={()=>del(p.id)} className="text-xs bg-red-950/50 text-red-400 px-3 py-1.5 rounded-full border border-red-900/50">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}