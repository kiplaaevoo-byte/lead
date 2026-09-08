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
          <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-1 rounded ml-4">LIVE</span>
          <Link href="/admin" className="ml-auto text-xs text-zinc-500 hover:text-white">Admin</Link>
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85]">We track what<br/><span className="text-zinc-600">Bomet says</span> about you<br/><span className="text-green-500">— LIVE.</span></h1>
        <div className="mt-6 text-xs text-zinc-500 tracking-widest uppercase">{count||14} mentions tracked • Auto-scan every 15min • FB / IG / X</div>
        <div className="mt-16 grid md:grid-cols-3 gap-4">
          {politicians?.map((p:any)=>(
            <Link key={p.id} href={`/politician/${p.id}`} className="group border border-zinc-800 bg-zinc-900/50 p-6 rounded-[20px] hover:border-zinc-600 hover:bg-zinc-900 transition-all">
              <div className="text-[10px] text-green-400 uppercase tracking-widest">{p.position||"Politician"} • Bomet</div>
              <div className="font-bold mt-3 text-lg group-hover:text-green-400">{p.name}</div>
              <div className="text-[11px] text-zinc-500 mt-2 line-clamp-1">{p.keywords?.slice(0,4).join(" • ")}</div>
              <div className="mt-6 text-xs text-zinc-400">View live mentions →</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
