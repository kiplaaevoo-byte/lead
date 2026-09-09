"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

type Politician = {
  id: string
  full_name?: string | null
  name?: string | null
  political_party?: string | null
  party?: string | null
  position?: string | null
  county?: string | null
  constituency?: string | null
  ward?: string | null
  plan?: string | null
  status?: string | null
  onboarding_complete?: boolean | null
  is_demo?: boolean | null
}

type Mention = {
  id: string
  sentiment?: string | null
}

type Entitlement = {
  mentions_limit?: number | null
  ward_intel?: boolean | null
  ai_briefing?: boolean | null
}

export default function Dashboard() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [email, setEmail] = useState("")
  const [politician, setPolitician] = useState<Politician | null>(null)
  const [mentions, setMentions] = useState<Mention[]>([])
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        /*
         * 1. Verify Supabase Auth session
         */
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          router.replace("/login")
          return
        }

        if (!mounted) return

        setEmail(user.email || "")

        /*
         * 2. Load ONLY the authenticated user's politician profile.
         *
         * Bernard/demo remains isolated because we explicitly
         * require is_demo = false.
         */
        const { data: profile, error: profileError } = await supabase
          .from("politicians")
          .select(`
            id,
            full_name,
            name,
            political_party,
            party,
            position,
            county,
            constituency,
            ward,
            plan,
            status,
            onboarding_complete,
            is_demo
          `)
          .eq("user_id", user.id)
          .eq("is_demo", false)
          .maybeSingle()

        if (profileError) {
          console.error("Profile loading error:", profileError)
          router.replace("/register")
          return
        }

        if (!profile) {
          router.replace("/register")
          return
        }

        /*
         * 3. New accounts must complete onboarding first.
         */
        if (profile.onboarding_complete === false) {
          router.replace("/welcome")
          return
        }

        if (!mounted) return

        setPolitician(profile)

        /*
         * 4. Load mentions belonging ONLY to this politician.
         */
        const { data: mentionData, error: mentionError } = await supabase
          .from("mentions")
          .select("id, sentiment")
          .eq("politician_id", profile.id)
          .order("created_at", { ascending: false })

        if (mentionError) {
          console.warn("Mentions could not be loaded:", mentionError)
        } else if (mounted) {
          setMentions(mentionData || [])
        }

        /*
         * 5. Load entitlement information.
         *
         * If the table is not available yet, the dashboard still
         * remains usable instead of crashing.
         */
        const {
          data: entitlementData,
          error: entitlementError,
        } = await supabase
          .from("entitlements")
          .select(`
            mentions_limit,
            ward_intel,
            ai_briefing
          `)
          .eq("politician_id", profile.id)
          .maybeSingle()

        if (entitlementError) {
          console.warn(
            "Entitlements could not be loaded:",
            entitlementError
          )
        } else if (mounted) {
          setEntitlement(entitlementData)
        }
      } catch (error) {
        console.error("Dashboard initialization error:", error)
        router.replace("/login")
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    init()

    /*
     * Keep the dashboard synchronized with Supabase Auth.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/login")
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const logout = async () => {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await supabase.auth.signOut()
      router.replace("/login")
    } finally {
      setLoggingOut(false)
    }
  }

  const filteredMentions = useMemo(() => {
    if (!query.trim()) return mentions

    return mentions.filter((mention) =>
      (mention.sentiment || "")
        .toLowerCase()
        .includes(query.toLowerCase())
    )
  }, [mentions, query])

  const positive = mentions.filter(
    (mention) =>
      mention.sentiment?.toLowerCase() === "positive"
  ).length

  const negative = mentions.filter(
    (mention) =>
      mention.sentiment?.toLowerCase() === "negative"
  ).length

  const neutral = mentions.filter(
    (mention) =>
      mention.sentiment?.toLowerCase() === "neutral"
  ).length

  const fullName =
    politician?.full_name ||
    politician?.name ||
    "Political Leader"

  const party =
    politician?.political_party ||
    politician?.party ||
    "Independent"

  const plan = politician?.plan
    ? politician.plan.charAt(0).toUpperCase() +
      politician.plan.slice(1)
    : "Basic"

  const firstName =
    fullName.split(" ")[0] || "there"

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/10 border-t-[#00ff66] rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-sm opacity-60">
            Loading your intelligence...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* ================= TOP NAV ================= */}
      <div className="border-b border-white/10 sticky top-0 bg-[#050505]/85 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">

          <Link
            href="/"
            className="font-bold text-xl tracking-tight"
          >
            LEAD<span className="text-[#00ff66]">.</span>
          </Link>

          <div className="flex items-center gap-3">

            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">
                {fullName}
              </p>

              <p className="text-[11px] opacity-40">
                {email}
              </p>
            </div>

            <button
              onClick={logout}
              disabled={loggingOut}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50 text-sm transition"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>

          </div>
        </div>
      </div>

      {/* ================= MAIN ================= */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#00ff66] font-semibold">
              Political Intelligence
            </p>

            <h1 className="text-3xl md:text-4xl font-bold mt-2">
              Good to see you, {firstName}.
            </h1>

            <p className="text-sm opacity-50 mt-2">
              Monitor your political presence, mentions and public sentiment.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sentiment..."
              className="px-4 py-3 rounded-xl bg-[#111] border border-white/10 text-sm w-full sm:w-[220px] outline-none focus:border-[#00ff66]/50 transition"
            />

            <Link
              href="/admin"
              className="px-5 py-3 rounded-xl bg-[#00ff66] text-black text-sm font-bold text-center hover:opacity-90 transition"
            >
              + Add
            </Link>

          </div>
        </div>

        {/* ================= PROFILE CARD ================= */}
        <div className="mt-7 p-6 rounded-2xl bg-[#111] border border-white/10">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>
              <div className="flex items-center gap-3">

                <h2 className="text-xl font-bold">
                  {fullName}
                </h2>

                <span className="px-2.5 py-1 rounded-full bg-[#00ff66]/10 text-[#00ff66] text-[10px] font-bold uppercase">
                  {plan}
                </span>

              </div>

              <p className="text-sm opacity-50 mt-2">
                {politician?.position || "Political Leader"} • {party}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">

              <div className="px-4 py-2 rounded-xl bg-black/30">
                <p className="text-xs opacity-40">County</p>
                <p className="text-sm font-semibold mt-1">
                  {politician?.county || "—"}
                </p>
              </div>

              <div className="px-4 py-2 rounded-xl bg-black/30">
                <p className="text-xs opacity-40">Constituency</p>
                <p className="text-sm font-semibold mt-1">
                  {politician?.constituency || "—"}
                </p>
              </div>

              <div className="px-4 py-2 rounded-xl bg-black/30">
                <p className="text-xs opacity-40">Ward</p>
                <p className="text-sm font-semibold mt-1">
                  {politician?.ward || "—"}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">

          <div className="p-5 rounded-2xl bg-[#111] border border-white/10">
            <p className="text-xs opacity-40 uppercase">
              Total Mentions
            </p>

            <p className="text-3xl font-bold mt-2">
              {mentions.length}
            </p>

            {entitlement?.mentions_limit != null && (
              <p className="text-xs opacity-40 mt-1">
                Plan limit: {entitlement.mentions_limit}
              </p>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-[#111] border border-white/10">
            <p className="text-xs opacity-40 uppercase">
              Positive
            </p>

            <p className="text-3xl font-bold text-[#00ff66] mt-2">
              {positive}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#111] border border-white/10">
            <p className="text-xs opacity-40 uppercase">
              Negative
            </p>

            <p className="text-3xl font-bold mt-2">
              {negative}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#111] border border-white/10">
            <p className="text-xs opacity-40 uppercase">
              Neutral
            </p>

            <p className="text-3xl font-bold mt-2">
              {neutral}
            </p>
          </div>

        </div>

        {/* ================= INTELLIGENCE ================= */}
        <div className="grid lg:grid-cols-3 gap-5 mt-5">

          {/* Mentions */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#111] border border-white/10">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-bold text-lg">
                  Mentions Intelligence
                </h2>

                <p className="text-xs opacity-40 mt-1">
                  Recent signals connected to your profile.
                </p>
              </div>

              <span className="text-xs opacity-40">
                {filteredMentions.length} results
              </span>

            </div>

            {filteredMentions.length === 0 ? (
              <div className="text-center py-12">

                <div className="text-4xl mb-3">
                  📡
                </div>

                <h3 className="font-bold">
                  No mentions yet
                </h3>

                <p className="text-sm opacity-50 mt-2 max-w-md mx-auto">
                  Your intelligence feed will appear here once mentions
                  connected to your political profile are collected.
                </p>

              </div>
            ) : (
              <div className="mt-5 space-y-2">

                {filteredMentions.slice(0, 8).map((mention) => {

                  const sentiment =
                    mention.sentiment?.toLowerCase() || "unknown"

                  return (
                    <div
                      key={mention.id}
                      className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          Political mention detected
                        </p>

                        <p className="text-xs opacity-40 mt-1">
                          Sentiment analysis available
                        </p>
                      </div>

                      <span
                        className={`text-xs px-3 py-1.5 rounded-full ${
                          sentiment === "positive"
                            ? "bg-[#00ff66]/10 text-[#00ff66]"
                            : sentiment === "negative"
                            ? "bg-red-500/10 text-red-400"
                            : sentiment === "neutral"
                            ? "bg-white/10 text-white/60"
                            : "bg-white/5 text-white/40"
                        }`}
                      >
                        {sentiment}
                      </span>
                    </div>
                  )
                })}

              </div>
            )}
          </div>

          {/* Plan */}
          <div className="p-6 rounded-2xl bg-[#111] border border-white/10">

            <p className="text-xs uppercase tracking-widest opacity-40">
              Your Access
            </p>

            <h2 className="text-2xl font-bold mt-2">
              {plan}
            </h2>

            <div className="mt-6 space-y-4">

              <div className="flex justify-between text-sm">
                <span className="opacity-50">
                  Mention monitoring
                </span>

                <span className="text-[#00ff66]">
                  Enabled
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="opacity-50">
                  County intelligence
                </span>

                <span className="text-[#00ff66]">
                  Enabled
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="opacity-50">
                  Ward intelligence
                </span>

                <span>
                  {entitlement?.ward_intel
                    ? "Enabled"
                    : "Upgrade"}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="opacity-50">
                  AI briefing
                </span>

                <span>
                  {entitlement?.ai_briefing
                    ? "Enabled"
                    : "Upgrade"}
                </span>
              </div>

            </div>

            <Link
              href="/"
              className="block text-center mt-7 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-sm transition"
            >
              View Platform
            </Link>

          </div>
        </div>

        {/* ================= QUICK ACTIONS ================= */}
        <div className="mt-5 grid sm:grid-cols-3 gap-3">

          <Link
            href="/welcome"
            className="p-5 rounded-2xl bg-[#111] border border-white/10 hover:border-[#00ff66]/30 transition"
          >
            <div className="text-xl">👤</div>
            <h3 className="font-bold mt-3">
              Profile
            </h3>
            <p className="text-xs opacity-40 mt-1">
              Manage your political profile.
            </p>
          </Link>

          <Link
            href="/admin"
            className="p-5 rounded-2xl bg-[#111] border border-white/10 hover:border-[#00ff66]/30 transition"
          >
            <div className="text-xl">⚙️</div>
            <h3 className="font-bold mt-3">
              Management
            </h3>
            <p className="text-xs opacity-40 mt-1">
              Manage tracker configuration.
            </p>
          </Link>

          <Link
            href="/"
            className="p-5 rounded-2xl bg-[#111] border border-white/10 hover:border-[#00ff66]/30 transition"
          >
            <div className="text-xl">📊</div>
            <h3 className="font-bold mt-3">
              Explore
            </h3>
            <p className="text-xs opacity-40 mt-1">
              Explore the political intelligence platform.
            </p>
          </Link>

        </div>

      </main>
    </div>
  )
}