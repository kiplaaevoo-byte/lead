"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Politician = {
  id: string
  user_id?: string
  name?: string
  full_name?: string
  username?: string
  phone?: string
  email?: string
  county?: string
  constituency?: string
  ward?: string
  political_party?: string
  position?: string
  plan?: string
  status?: string
  onboarding_complete?: boolean
  is_demo?: boolean
  profile_photo_url?: string
}

type Mention = {
  id: string
  politician_id: string
  platform?: string
  content?: string
  text?: string
  sentiment?: string
  sentiment_score?: number
  created_at?: string
}

type Entitlements = {
  mentions_limit?: number
  ward_intel?: boolean
  ai_briefing?: boolean
}

export default function Dashboard() {
  const router = useRouter()

  const [politician, setPolitician] = useState<Politician | null>(null)
  const [mentions, setMentions] = useState<Mention[]>([])
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      try {
        /*
         * STEP 1
         * Get the real Supabase Auth session.
         * No localStorage authentication.
         */
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          router.replace("/login")
          return
        }

        /*
         * STEP 2
         * Get the politician belonging to this authenticated user.
         *
         * IMPORTANT:
         * is_demo=false prevents the real dashboard from accidentally
         * loading Bernard's demo profile.
         */
        const { data: pol, error: politicianError } = await supabase
          .from("politicians")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_demo", false)
          .maybeSingle()

        if (politicianError) {
          console.error("Politician loading error:", politicianError)
        }

        if (!pol) {
          router.replace("/welcome")
          return
        }

        /*
         * STEP 3
         * If onboarding is incomplete, send the user to onboarding.
         */
        if (pol.onboarding_complete === false) {
          router.replace("/welcome")
          return
        }

        if (!mounted) return

        setPolitician(pol)

        /*
         * STEP 4
         * Load mentions belonging ONLY to this politician.
         */
        const { data: mentionData, error: mentionsError } = await supabase
          .from("mentions")
          .select("*")
          .eq("politician_id", pol.id)
          .order("created_at", { ascending: false })
          .limit(50)

        if (mentionsError) {
          console.error("Mentions loading error:", mentionsError)
        }

        if (!mounted) return

        setMentions(mentionData || [])

        /*
         * STEP 5
         * Load the user's entitlement record if available.
         *
         * maybeSingle() is intentional so the dashboard does not crash
         * during the transition while subscription/entitlement records
         * are being created.
         */
        const { data: entitlementData, error: entitlementError } =
          await supabase
            .from("entitlements")
            .select("*")
            .eq("politician_id", pol.id)
            .maybeSingle()

        if (entitlementError) {
          console.warn(
            "Entitlements not available:",
            entitlementError.message
          )
        }

        if (!mounted) return

        setEntitlements(entitlementData || null)
        setLoading(false)
      } catch (error) {
        console.error("Dashboard error:", error)

        if (mounted) {
          router.replace("/login")
        }
      }
    }

    loadDashboard()

    /*
     * Keep dashboard authentication synchronized.
     * If the user signs out in another tab, redirect immediately.
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
    await supabase.auth.signOut()
    router.replace("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-[#00ff66]/30 border-t-[#00ff66] animate-spin" />
          <p className="mt-4 text-sm text-white/50">
            Loading your political intelligence dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (!politician) {
    return null
  }

  /*
   * Sentiment calculation
   */
  const positive = mentions.filter(
    (mention) => mention.sentiment?.toLowerCase() === "positive"
  ).length

  const negative = mentions.filter(
    (mention) => mention.sentiment?.toLowerCase() === "negative"
  ).length

  const neutral = mentions.filter(
    (mention) => mention.sentiment?.toLowerCase() === "neutral"
  ).length

  const total = mentions.length

  const sentimentScore =
    total > 0 ? Math.round((positive / total) * 100) : 0

  const plan = politician.plan || "basic"

  const displayName =
    politician.full_name || politician.name || politician.username || "Politician"

  const mentionLimit = entitlements?.mentions_limit ?? 100

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-black">
              P
            </div>

            <div className="hidden sm:block font-black tracking-tight">
              POLITICAL TRACKER
              <span className="text-[#00ff66]">.KE</span>
            </div>

            <span className="hidden md:inline-flex text-[10px] px-2 py-1 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66]">
              PRIVATE • {politician.county || "KENYA"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-sm font-bold truncate max-w-[220px]">
                {displayName}
              </div>

              <div className="text-[11px] text-white/50">
                {politician.phone || politician.email || "Verified account"}
              </div>
            </div>

            <button
              onClick={logout}
              className="text-xs px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="p-4 md:p-8 max-w-[1400px] mx-auto">
        {/* WELCOME */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black">
                Welcome, {displayName} 👋
              </h1>

              <p className="text-sm text-white/50 mt-2">
                {politician.position || "Political Profile"}
                {politician.political_party
                  ? ` • ${politician.political_party}`
                  : ""}
                {politician.county
                  ? ` • ${politician.county} County`
                  : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66]">
                {plan} plan
              </span>

              {politician.status && (
                <span className="text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60">
                  {politician.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
          {/* Mentions */}
          <div className="p-6 rounded-[24px] bg-[#101010] border border-white/10">
            <div className="text-[11px] text-white/40 uppercase tracking-wider">
              Mentions
            </div>

            <div className="mt-2 text-[36px] font-black">
              {total}
            </div>

            <div className="mt-2 text-xs text-white/40">
              Limit: {mentionLimit}
            </div>
          </div>

          {/* Sentiment */}
          <div className="p-6 rounded-[24px] bg-[#101010] border border-white/10">
            <div className="text-[11px] text-white/40 uppercase tracking-wider">
              Positive Sentiment
            </div>

            <div className="mt-2 text-[36px] font-black">
              {total ? `${sentimentScore}%` : "—"}
            </div>

            <div className="mt-2 text-xs text-white/40">
              {positive} positive mentions
            </div>
          </div>

          {/* Negative */}
          <div className="p-6 rounded-[24px] bg-[#101010] border border-white/10">
            <div className="text-[11px] text-white/40 uppercase tracking-wider">
              Negative
            </div>

            <div className="mt-2 text-[36px] font-black">
              {negative}
            </div>

            <div className="mt-2 text-xs text-white/40">
              {neutral} neutral mentions
            </div>
          </div>

          {/* Account */}
          <div className="p-6 rounded-[24px] bg-[#00ff66] text-black">
            <div className="text-[11px] text-black/50 uppercase tracking-wider">
              Account
            </div>

            <div className="mt-2 text-[18px] font-black uppercase">
              {plan} • Active
            </div>

            <div className="text-xs text-black/60 mt-2">
              Private political intelligence
            </div>
          </div>
        </div>

        {/* LOCATION / PROFILE */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-6 rounded-[24px] bg-[#101010] border border-white/10">
            <div className="text-xs text-white/40 uppercase tracking-wider">
              Political Profile
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] text-white/40">COUNTY</div>
                <div className="mt-1 font-bold">
                  {politician.county || "Not set"}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-white/40">
                  CONSTITUENCY
                </div>
                <div className="mt-1 font-bold">
                  {politician.constituency || "Not set"}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-white/40">WARD</div>
                <div className="mt-1 font-bold">
                  {politician.ward || "Not set"}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-[24px] bg-[#101010] border border-white/10">
            <div className="text-xs text-white/40 uppercase tracking-wider">
              Intelligence Access
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>County Intelligence</span>
                <span className="text-[#00ff66]">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Ward Intelligence</span>
                <span
                  className={
                    entitlements?.ward_intel
                      ? "text-[#00ff66]"
                      : "text-white/30"
                  }
                >
                  {entitlements?.ward_intel ? "ACTIVE" : "LOCKED"}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>AI Briefing</span>
                <span
                  className={
                    entitlements?.ai_briefing
                      ? "text-[#00ff66]"
                      : "text-white/30"
                  }
                >
                  {entitlements?.ai_briefing ? "ACTIVE" : "LOCKED"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MENTIONS FEED */}
        <div className="mt-8 rounded-[24px] bg-[#101010] border border-white/10 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-bold text-lg">
                Live Mentions Feed
              </h2>

              <p className="text-xs text-white/40 mt-1">
                Monitoring mentions associated with {displayName}
              </p>
            </div>

            <div className="text-xs text-white/40">
              Showing latest {Math.min(total, 50)}
            </div>
          </div>

          <div className="mt-6">
            {total === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                <div className="text-3xl">📡</div>

                <div className="mt-3 font-bold">
                  No mentions yet
                </div>

                <div className="mt-1 text-sm text-white/50 max-w-md mx-auto">
                  The monitoring engine is active for{" "}
                  {displayName}
                  {politician.county
                    ? ` in ${politician.county} County`
                    : ""}
                  . New intelligence will appear here when available.
                </div>
              </div>
            ) : (
              mentions.map((mention) => (
                <div
                  key={mention.id}
                  className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 mb-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase">
                      {mention.platform || "Unknown"}
                    </span>

                    {mention.sentiment && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/50">
                        {mention.sentiment}
                      </span>
                    )}

                    {mention.created_at && (
                      <span className="text-[10px] text-white/30">
                        {new Date(
                          mention.created_at
                        ).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-white/80 leading-6">
                    {mention.text ||
                      mention.content ||
                      "No mention content available."}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FOOTER SECURITY NOTICE */}
        <div className="mt-6 pb-8 text-center">
          <p className="text-[10px] text-white/25">
            Political Tracker OS • Secure authenticated session •
            Private account data
          </p>
        </div>
      </main>
    </div>
  )
}