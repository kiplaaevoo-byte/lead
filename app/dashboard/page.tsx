"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Profile = {
  id: string
  user_id: string
  name?: string | null
  full_name?: string | null
  party?: string | null
  political_party?: string | null
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
  politician_id: string
  platform?: string | null
  content?: string | null
  sentiment?: string | null
  sentiment_score?: number | null
  is_negative_alert?: boolean | null
  created_at: string
}

type Entitlement = {
  mentions_limit?: number | null
  ward_intel?: boolean | null
  ai_briefing?: boolean | null
  advanced_alerts?: boolean | null
  extended_history?: boolean | null
}

function formatDate(date: string) {
  const value = new Date(date)

  if (Number.isNaN(value.getTime())) {
    return "Unknown time"
  }

  return value.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function getPlatformLabel(platform?: string | null) {
  if (!platform) return "Source"

  const normalized = platform.toLowerCase()

  if (normalized === "x" || normalized === "twitter") return "X"
  if (normalized === "facebook") return "Facebook"
  if (normalized === "instagram") return "Instagram"
  if (normalized === "tiktok") return "TikTok"
  if (normalized === "youtube") return "YouTube"

  return platform
}

function getSentimentLabel(sentiment?: string | null) {
  if (!sentiment) return "Unclassified"

  return sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase()
}

function getSentimentBadge(sentiment?: string | null) {
  const value = sentiment?.toLowerCase()

  if (value === "positive") {
    return "border-[#00ff66]/20 bg-[#00ff66]/5 text-[#00ff66]"
  }

  if (value === "negative") {
    return "border-red-500/20 bg-red-500/5 text-red-400"
  }

  if (value === "neutral") {
    return "border-yellow-500/20 bg-yellow-500/5 text-yellow-400"
  }

  return "border-white/10 bg-white/5 text-white/40"
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
    setError("")

    try {
      /*
       * 1. AUTHENTICATION
       *
       * We use Supabase Auth as the source of truth.
       * No localStorage authentication.
       */
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        router.replace("/login")
        return
      }

      if (!session) {
        router.replace("/login")
        return
      }

      setChecked(true)

      /*
       * 2. LOAD ONLY THE AUTHENTICATED USER'S POLITICIAN PROFILE
       *
       * is_demo=false keeps the commercial user area separate
       * from the permanent Bernard demo profile.
       */
      const { data: profileData, error: profileError } = await supabase
        .from("politicians")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_demo", false)
        .maybeSingle()

      if (profileError) {
        console.error("Profile error:", profileError)
        setError("We could not load your political profile.")
        setLoading(false)
        return
      }

      if (!profileData) {
        router.replace("/register")
        return
      }

      setProfile(profileData)

      /*
       * 3. ONBOARDING CHECK
       */
      if (profileData.onboarding_complete === false) {
        router.replace("/welcome")
        return
      }

      /*
       * 4. LOAD RECENT MENTIONS
       *
       * These belong ONLY to this politician.
       *
       * We intentionally load a limited recent feed for performance.
       * The total KPI below uses count: "exact".
       */
      const { data: recentMentions, error: mentionsError } = await supabase
        .from("mentions")
        .select("*")
        .eq("politician_id", profileData.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (mentionsError) {
        console.error("Mentions error:", mentionsError)

        // Do not fake data if mentions cannot be loaded.
        setMentions([])
      } else {
        setMentions(recentMentions ?? [])
      }

      /*
       * 5. REAL TOTAL COUNT
       *
       * This is different from recentMentions.length.
       */
      const { count: mentionCount, error: countError } = await supabase
        .from("mentions")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("politician_id", profileData.id)

      if (countError) {
        console.error("Mention count error:", countError)
        setTotalMentions(recentMentions?.length ?? 0)
      } else {
        setTotalMentions(mentionCount ?? 0)
      }

      /*
       * 6. ENTITLEMENTS
       *
       * Optional for now. If the table is not available,
       * the dashboard continues without inventing permissions.
       */
      const { data: entitlementData, error: entitlementError } =
        await supabase
          .from("entitlements")
          .select("*")
          .eq("politician_id", profileData.id)
          .maybeSingle()

      if (entitlementError) {
        console.warn(
          "Entitlements unavailable:",
          entitlementError.message
        )
        setEntitlement(null)
      } else {
        setEntitlement(entitlementData)
      }

      setLoading(false)
    } catch (err) {
      console.error("Dashboard error:", err)
      setError("Something went wrong while loading your dashboard.")
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadDashboard()

    /*
     * Keep the dashboard synchronized with authentication state.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadDashboard, router])

  /*
   * Calculate sentiment from REAL returned mention data.
   */
  const sentiment = useMemo(() => {
    const classified = mentions.filter((mention) => {
      const value = mention.sentiment?.toLowerCase()
      return (
        value === "positive" ||
        value === "neutral" ||
        value === "negative"
      )
    })

    const positive = classified.filter(
      (mention) => mention.sentiment?.toLowerCase() === "positive"
    ).length

    const neutral = classified.filter(
      (mention) => mention.sentiment?.toLowerCase() === "neutral"
    ).length

    const negative = classified.filter(
      (mention) => mention.sentiment?.toLowerCase() === "negative"
    ).length

    const total = classified.length

    return {
      positive,
      neutral,
      negative,
      total,
      positivePercent: total ? Math.round((positive / total) * 100) : 0,
      neutralPercent: total ? Math.round((neutral / total) * 100) : 0,
      negativePercent: total ? Math.round((negative / total) * 100) : 0,
    }
  }, [mentions])

  /*
   * Negative alerts are calculated from real mention records.
   */
  const negativeAlerts = useMemo(() => {
    return mentions.filter((mention) => {
      const sentimentNegative =
        mention.sentiment?.toLowerCase() === "negative"

      return Boolean(mention.is_negative_alert) || sentimentNegative
    }).length
  }, [mentions])

  const displayName =
    profile?.name ||
    profile?.full_name ||
    "Political Profile"

  const party =
    profile?.party ||
    profile?.political_party ||
    "Party not provided"

  const location =
    [profile?.county, profile?.constituency, profile?.ward]
      .filter(Boolean)
      .join(" • ") || "Location not provided"

  const plan = profile?.plan
    ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)
    : "Basic"

  const hasMentions = totalMentions > 0

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  if (!checked || loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#00ff66] text-black flex items-center justify-center font-black animate-pulse">
            PT
          </div>

          <div className="mt-5 text-sm text-white/50">
            Loading your private intelligence...
          </div>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-black">Profile unavailable</h1>

          <p className="mt-3 text-sm text-white/50">
            We could not find your political profile.
          </p>

          <button
            onClick={() => router.replace("/register")}
            className="mt-6 px-5 py-3 rounded-xl bg-[#00ff66] text-black font-bold"
          >
            Complete Profile
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-300px] right-[-200px] w-[600px] h-[600px] rounded-full bg-[#00ff66]/5 blur-[140px]" />
        <div className="absolute bottom-[-300px] left-[-200px] w-[600px] h-[600px] rounded-full bg-green-500/5 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 bg-[#050505]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00ff66] text-black flex items-center justify-center font-black">
                PT
              </div>

              <div>
                <div className="font-black text-sm md:text-base">
                  POLITICAL TRACKER
                  <span className="text-[#00ff66]">.KE</span>
                </div>

                <div className="hidden sm:block text-[9px] text-white/30 uppercase tracking-[0.2em]">
                  Private Intelligence Command Center
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] text-white/50 uppercase tracking-wider">
                {plan} Plan
              </span>

              <button
                onClick={handleLogout}
                className="px-3 md:px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-7 md:py-10">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Welcome */}
        <section className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <div className="text-[#00ff66] text-xs font-bold uppercase tracking-[0.25em]">
                Intelligence Overview
              </div>

              <h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight">
                Welcome, {displayName}
              </h1>

              <p className="mt-3 text-sm md:text-base text-white/45">
                Your private political intelligence workspace.
              </p>
            </div>

            <div className="text-xs text-white/30 lg:text-right">
              <div>{party}</div>
              <div className="mt-1">{location}</div>
            </div>
          </div>
        </section>

        {/* Profile card */}
        <section className="mb-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                  👤
                </div>

                <div>
                  <div className="font-bold text-lg">{displayName}</div>

                  <div className="mt-1 text-sm text-white/40">
                    {profile.position || "Political profile"}
                  </div>

                  <div className="mt-1 text-xs text-white/30">
                    {location}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-2 rounded-xl bg-[#00ff66]/5 border border-[#00ff66]/10 text-[#00ff66] text-xs">
                  ✓ Private Profile
                </span>

                <span className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs">
                  {plan} Plan
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* KPI cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Mentions */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between">
              <span className="text-xl">📡</span>

              <span className="text-[9px] uppercase tracking-wider text-white/25">
                Live data
              </span>
            </div>

            <div className="mt-6 text-2xl md:text-3xl font-black">
              {totalMentions}
            </div>

            <div className="mt-1 text-xs text-white/40">
              Total mentions
            </div>
          </div>

          {/* Sentiment */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between">
              <span className="text-xl">📈</span>

              <span className="text-[9px] uppercase tracking-wider text-white/25">
                Recent data
              </span>
            </div>

            <div className="mt-6 text-2xl md:text-3xl font-black">
              {sentiment.total > 0
                ? `${sentiment.positivePercent}%`
                : "—"}
            </div>

            <div className="mt-1 text-xs text-white/40">
              Positive sentiment
            </div>
          </div>

          {/* Negative alerts */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between">
              <span className="text-xl">🚨</span>

              <span className="text-[9px] uppercase tracking-wider text-white/25">
                Recent data
              </span>
            </div>

            <div className="mt-6 text-2xl md:text-3xl font-black">
              {negativeAlerts}
            </div>

            <div className="mt-1 text-xs text-white/40">
              Negative signals
            </div>
          </div>

          {/* County */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between">
              <span className="text-xl">🗺️</span>

              <span className="text-[9px] uppercase tracking-wider text-white/25">
                Profile
              </span>
            </div>

            <div className="mt-6 text-lg md:text-xl font-black truncate">
              {profile.county || "—"}
            </div>

            <div className="mt-1 text-xs text-white/40">
              County intelligence
            </div>
          </div>
        </section>

        {/* Main grid */}
        <section className="mt-6 grid lg:grid-cols-[1.5fr_1fr] gap-6">
          {/* Intelligence feed */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="p-5 md:p-6 border-b border-white/10 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-white/30 uppercase tracking-[0.2em]">
                  Intelligence Feed
                </div>

                <h2 className="mt-1 font-black text-lg">
                  Recent mentions
                </h2>
              </div>

              <span className="text-[10px] px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40">
                {mentions.length} loaded
              </span>
            </div>

            {!hasMentions ? (
              <div className="p-8 md:p-12 text-center">
                <div className="text-4xl">📡</div>

                <h3 className="mt-5 font-bold text-lg">
                  No mentions tracked yet.
                </h3>

                <p className="mt-2 max-w-md mx-auto text-sm text-white/40 leading-relaxed">
                  Connect your first source in Settings to begin building your
                  intelligence feed.
                </p>

                <button
                  onClick={() => router.push("/settings")}
                  className="mt-6 px-5 py-3 rounded-xl bg-[#00ff66] text-black font-bold text-sm"
                >
                  Configure Sources →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {mentions.map((mention) => (
                  <div
                    key={mention.id}
                    className="p-5 hover:bg-white/[0.02] transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white/60">
                          {getPlatformLabel(mention.platform)}
                        </span>

                        <span className="text-[10px] text-white/20">
                          •
                        </span>

                        <span className="text-[10px] text-white/30">
                          {formatDate(mention.created_at)}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-1 rounded-full border text-[9px] font-bold uppercase ${getSentimentBadge(
                          mention.sentiment
                        )}`}
                      >
                        {getSentimentLabel(mention.sentiment)}
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-white/60 leading-relaxed">
                      {mention.content || "Mention content unavailable."}
                    </p>

                    {mention.is_negative_alert && (
                      <div className="mt-4 inline-flex items-center gap-2 text-[10px] text-red-400">
                        <span>🚨</span>
                        Negative alert
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Intelligence summary */}
          <div className="space-y-6">
            {/* Sentiment */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
              <div className="text-xs text-white/30 uppercase tracking-[0.2em]">
                Sentiment
              </div>

              <h2 className="mt-1 font-black text-lg">
                Recent data breakdown
              </h2>

              {sentiment.total === 0 ? (
                <div className="mt-8 py-6 text-center">
                  <div className="text-3xl">📊</div>

                  <p className="mt-4 text-sm text-white/40">
                    No classified mentions yet.
                  </p>
                </div>
              ) : (
                <div className="mt-7 space-y-5">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">Positive</span>
                      <span className="text-[#00ff66]">
                        {sentiment.positivePercent}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-[#00ff66]"
                        style={{
                          width: `${sentiment.positivePercent}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">Neutral</span>
                      <span className="text-yellow-400">
                        {sentiment.neutralPercent}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{
                          width: `${sentiment.neutralPercent}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">Negative</span>
                      <span className="text-red-400">
                        {sentiment.negativePercent}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-red-400"
                        style={{
                          width: `${sentiment.negativePercent}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI briefing */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-white/30 uppercase tracking-[0.2em]">
                    AI Intelligence
                  </div>

                  <h2 className="mt-1 font-black text-lg">
                    AI Briefing
                  </h2>
                </div>

                <span className="text-[9px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/40">
                  COMING SOON
                </span>
              </div>

              <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <div className="text-2xl">🤖</div>

                <p className="mt-4 text-sm text-white/50 leading-relaxed">
                  AI briefing will be configured after enough real mention
                  data is available.
                </p>

                <div className="mt-4 text-xs text-white/30">
                  {totalMentions >= 10
                    ? "Your profile has enough mention data for the next intelligence layer."
                    : `Coming soon — configured after 10 mentions. Current data: ${totalMentions}.`}
                </div>
              </div>
            </div>

            {/* Plan */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/30 uppercase tracking-[0.2em]">
                    Current Plan
                  </div>

                  <h2 className="mt-1 font-black text-xl">{plan}</h2>
                </div>

                <div className="w-10 h-10 rounded-xl bg-[#00ff66]/5 border border-[#00ff66]/10 flex items-center justify-center">
                  ✓
                </div>
              </div>

              <div className="mt-5 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Mention limit</span>
                  <span className="text-white/70">
                    {entitlement?.mentions_limit ?? "Plan based"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">Ward intelligence</span>
                  <span className="text-white/70">
                    {entitlement?.ward_intel ? "Enabled" : "Not enabled"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">AI briefing</span>
                  <span className="text-white/70">
                    {entitlement?.ai_briefing ? "Enabled" : "Coming soon"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Empty-data state / source CTA */}
        {!hasMentions && (
          <section className="mt-6">
            <div className="rounded-3xl border border-[#00ff66]/10 bg-[#00ff66]/[0.025] p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="text-[#00ff66] text-xs font-bold uppercase tracking-[0.2em]">
                    Get Started
                  </div>

                  <h2 className="mt-2 text-2xl font-black">
                    Connect your first intelligence source.
                  </h2>

                  <p className="mt-2 text-sm text-white/40 max-w-xl">
                    Your dashboard will populate as configured sources begin
                    supplying mention data.
                  </p>
                </div>

                <button
                  onClick={() => router.push("/settings")}
                  className="shrink-0 px-5 py-3 rounded-xl bg-[#00ff66] text-black font-bold text-sm"
                >
                  Open Settings →
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-[10px] text-white/25">
          <span>
            Political Tracker.ke • Private political intelligence
          </span>

          <span>
            Your dashboard data is restricted to your authenticated profile.
          </span>
        </footer>
      </div>
    </main>
  )
}