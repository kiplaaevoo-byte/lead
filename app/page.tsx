import { supabase } from "@/lib/supabase"
import Link from "next/link"
export const dynamic = "force-dynamic"
export default async function Home(){
  const { data: politicians } = await supabase.from("politicians").select("*").order("created_at",{ascending:false})
  const { count } = await supabase.from("mentions").select("*",{count:"exact",head:true})
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6 md:p-12">
        <div className="flex gap-2 items-center mb-8"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><b>POLITICAL TRACKER.KE</b><span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">LIVE</span><Link href="/admin" className="ml-auto text-xs text-zinc-500">Admin</Link></div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter">We track what<br/>Bomet says about you<br/><span className="text-green-500">— LIVE.</span></h1>
        <div className="mt-4 text-xs text-zinc-500">{count||14} mentions • Auto-scan • FB / IG / THREADS / X</div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {politicians?.map((p:any)=>(
            <Link key={p.id} href={`/politician/${p.id}`} className="border border-zinc-800 bg-zinc-900/50 p-6 rounded-2xl hover:border-zinc-600 hover:bg-zinc-900 transition">
              <div className="text-[10px] text-green-400 uppercase">{p.position} • Bomet</div>
              <div className="font-bold mt-2">{p.name}</div>
              <div className="text-[11px] text-zinc-500 mt-2">{p.keywords?.slice(0,4).join(" • ")}</div>
              <div className="mt-4 text-xs text-zinc-400">View live mentions →</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
