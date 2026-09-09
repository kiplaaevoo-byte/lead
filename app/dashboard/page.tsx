"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Profile = any
type Mention = any
type Entitlement = any

function formatDate(date: string) {
  const d = new Date(date)
  return isNaN(d.getTime())? "—" : d.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
}

export default function Dashboard() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mentions, setMentions] = useState<Mention[]>([])
  const [totalMentions, setTotalMentions] = useState(0)
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null)
  const [error, setError] = useState("")

  const loadDashboard = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace("/login"); return }
      setChecked(true)

      // Failsafe: try with is_demo, if column missing, try without
      let profileData = null
      let { data, error } = await supabase.from("politicians").select("*").eq("user_id", session.user.id).maybeSingle()

      // If we have is_demo column, filter out demo in client
      if (data && data.is_demo === true) {
        // This is demo profile, try to find non-demo
        const { data: realProfile } = await supabase.from("politicians").select("*").eq("user_id", session.user.id).eq("is_demo", false).maybeSingle()
        profileData = realProfile || null
        if (!realProfile) { // allow demo if no real
          profileData = data.is_demo? null : data
        }
      } else {
        profileData = data
      }

      if (error) { setError("Could not load profile"); setLoading(false); return }
      if (!profileData) { router.replace("/register"); return }
      setProfile(profileData)

      if (profileData.onboarding_complete === false) { router.replace("/welcome"); return }

      const { data: recent } = await supabase.from("mentions").select("*").eq("politician_id", profileData.id).order("created_at", { ascending: false }).limit(20)
      setMentions(recent || [])

      const { count } = await supabase.from("mentions").select("id", { count: "exact", head: true }).eq("politician_id", profileData.id)
      setTotalMentions(count?? recent?.length?? 0)

      const { data: ent } = await supabase.from("entitlements").select("*").eq("politician_id", profileData.id).maybeSingle()
      setEntitlement(ent || null)

      setLoading(false)
    } catch (e) {
      console.error(e)
      setError("Something went wrong loading dashboard")
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadDashboard()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => { if (!s) router.replace("/login") })
    return () => subscription.unsubscribe()
  }, [loadDashboard, router])

  const sentiment = useMemo(() => {
    const c = mentions.filter((m: any) => ["positive","neutral","negative"].includes(m.sentiment?.toLowerCase()))
    const pos = c.filter((m: any) => m.sentiment?.toLowerCase() === "positive").length
    const neu = c.filter((m: any) => m.sentiment?.toLowerCase() === "neutral").length
    const neg = c.filter((m: any) => m.sentiment?.toLowerCase() === "negative").length
    const total = c.length
    return { pos, neu, neg, total, pPos: total?Math.round(pos/total*100):0, pNeu: total?Math.round(neu/total*100):0, pNeg: total?Math.round(neg/total*100):0 }
  }, [mentions])

  const negativeAlerts = useMemo(() => mentions.filter((m: any) => m.is_negative_alert || m.sentiment?.toLowerCase() === "negative").length, [mentions])

  if (!checked || loading) return <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center"><div className="w-12 h-12 rounded-2xl bg-[#00ff66] text-black flex items-center justify-center font-black animate-pulse">PT</div></main>
  if (!profile) return null

  const displayName = profile.name || profile.full_name || "Political Profile"
  const party = profile.party || profile.political_party || "Party not provided"
  const location = [profile.county, profile.constituency, profile.ward].filter(Boolean).join(" • ") || "Location not provided"
  const plan = profile.plan? profile.plan.charAt(0).toUpperCase()+profile.plan.slice(1) : "Basic"

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div className="flex gap-3 items-center"><div className="w-10 h-10 rounded-xl bg-[#00ff66] text-black flex items-center justify-center font-black">PT</div><div className="font-black text-sm">POLITICAL TRACKER<span className="text-[#00ff66]">.KE</span></div></div>
          <button onClick={async()=>{await supabase.auth.signOut(); router.replace("/login")}} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">Logout</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <h1 className="text-3xl md:text-5xl font-black">Welcome, {displayName}</h1>
        <p className="text-white/40 mt-2">{party} • {location} • {plan} Plan</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"><div className="text-xl">📡</div><div className="text-3xl font-black mt-4">{totalMentions}</div><div className="text-xs text-white/40">Total mentions</div></div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"><div className="text-xl">📈</div><div className="text-3xl font-black mt-4">{sentiment.total? `${sentiment.pPos}%` : "—"}</div><div className="text-xs text-white/40">Positive</div></div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"><div className="text-xl">🚨</div><div className="text-3xl font-black mt-4">{negativeAlerts}</div><div className="text-xs text-white/40">Negative signals</div></div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"><div className="text-xl">🗺️</div><div className="text-xl font-black mt-4 truncate">{profile.county || "—"}</div><div className="text-xs text-white/40">County</div></div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between"><h2 className="font-black">Recent mentions</h2><span className="text-xs text-white/30">{mentions.length} loaded</span></div>
          {mentions.length===0? (
            <div className="p-12 text-center"><div className="text-4xl">📡</div><h3 className="font-bold mt-4">No mentions tracked yet</h3><p className="text-sm text-white/40 mt-2">Connect your first source in Settings</p></div>
          ) : (
            <div className="divide-y divide-white/5">{mentions.map((m:any)=><div key={m.id} className="p-5"><div className="flex justify-between text-xs text-white/30"><span>{m.platform || "Source"}</span><span>{formatDate(m.created_at)}</span></div><p className="mt-3 text-sm text-white/60">{m.content || "No content"}</p></div>)}</div>
          )}
        </div>
      </div>
    </main>
  )
}