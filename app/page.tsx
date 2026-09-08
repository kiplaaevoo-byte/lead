import { supabase } from "@/lib/supabase"
import Link from "next/link"
export const dynamic = "force-dynamic"
export default async function Home(){
  const { data: politicians } = await supabase.from("politicians").select("*").order("created_at",{ascending:false})
  const { count } = await supabase.from("mentions").select("*",{count:"exact",head:true})
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-8 md:p-12">
        <div className="flex gap-3 items-center mb-10">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <b className="tracking-tighter text-xl">POLITICAL TRACKER<span className="text-green-500">.KE</span></b>
          <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-1 rounded ml-4">LIVE SCANNING</span>
          <Link href="/admin" className="ml-auto text-xs text-zinc-500 hover:text-white">Admin</Link>
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85]">
          We track what<br/><span className="text-zinc-600">social media</span> says<br/>about you <span className="text-green-500">— LIVE.</span>
        </h1>
        <div className="mt-8 flex flex-wrap gap-3 text-[11px] tracking-widest uppercase">
          <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">{count||0} mentions</span>
          <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">Facebook</span>
          <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">Instagram</span>
          <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">Threads</span>
          <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">X / Twitter</span>
          <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full">Auto-scan 15min</span>
        </div>
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {politicians?.map((p:any)=>(
            <Link key={p.id} href={`/politician/${p.id}`} className="group border border-zinc-800 bg-zinc-900/50 p-6 rounded-[20px] hover:border-white/20 hover:bg-zinc-900 transition-all">
              <div className="flex justify-between">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{p.position||"Leader"} • All Platforms</div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="font-bold mt-3 text-xl group-hover:text-green-400 transition-colors">{p.name}</div>
              <div className="text-[11px] text-zinc-500 mt-3 line-clamp-1">{p.keywords?.slice(0,5).join(" • ")}</div>
              <div className="mt-6 flex justify-between items-center">
                <span className="text-xs text-zinc-300 group-hover:text-white">View live mentions →</span>
                <span className="text-[10px] text-zinc-600">LIVE</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-20 text-center text-[11px] text-zinc-600 tracking-widest uppercase">
          Tracking Facebook • Instagram • Threads • X • TikTok • YouTube — Real time
        </div>
      </div>
    </div>
  )
}