"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  platform?: string | null
  content?: string | null
  sentiment?: string | null
  sentiment_score?: number | null
  is_negative_alert?: boolean | null
  created_at?: string | null
}

type Entitlement = {
  mentions_limit?: number | null
  ward_intel?: boolean | null
  ai_briefing?: boolean | null
}

export default function Dashboard() {
  const router = useRouter()

  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  const [email, setEmail] = useState("")
  const [politician, setPolitician] = useState<Politician | null>(null)
  const [mentions, setMentions] = useState<Mention[]>([])
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null)

  const [search, setSearch] = useState("")
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    let mounted = true

    const run = async () => {
      try {
        /*
         * AUTH CHECK
         *
         * Keep this first. It prevents the dashboard redirect loop
         * while still protecting the page.
         */
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        console.log("SESSION CHECK:", session)

        if (sessionError || !session) {
          console.log("No session -> login")
          router.replace("/login")
          return
        }

        if (!mounted) return

        setEmail(session.user.email || "")
        setChecked(true)

        /*
         * Load ONLY the authenticated user's politician profile.
         *
         * is_demo=false permanently separates normal users
         * from the Bernard demo profile.
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
          .eq("user_id", session.user.id)
          .eq("is_demo", false)
          .maybeSingle()

        if (profileError) {
          console.error("PROFILE ERROR:", profileError)

          if (mounted) {
            setLoading(false)
          }

          return
        }

        if (!profile) {
          console.log("No politician profile found")
          router.replace("/register")
          return
        }

        /*
         * Send incomplete accounts to onboarding.
         */
        if (profile.onboarding_complete === false) {
          router.replace("/welcome")
          return
        }

        if (!mounted) return

        setPolitician(profile)

        /*
         * Load mentions belonging ONLY to this politician.
         */
        const { data: mentionData, error: mentionError } =
          await supabase
            .from("mentions")
            .select(`
              id,
              platform,
              content,
              sentiment,
              sentiment_score,
              is_negative_alert,
              created_at
            `)
            .eq("politician_id", profile.id)
            .order("created_at", { ascending: false })

        if (mentionError) {
          console.warn("MENTIONS ERROR:", mentionError)
        } else if (mounted) {
          setMentions(mentionData || [])
        }

        /*
         * Load entitlements.
         *
         * Failure here should NOT destroy the dashboard.
         */
        const { data: entitlementData, error: entitlementError } =
          await supabase
            .from("entitlements")
            .select(`
              mentions_limit,
              ward_intel,
              ai_briefing
            `)
            .eq("politician_id", profile.id)
            .maybeSingle()

        if (entitlementError) {
          console.warn("ENTITLEMENT ERROR:", entitlementError)
        } else if (mounted) {
          setEntitlement(entitlementData)
        }

      } catch (error) {
        console.error("DASHBOARD ERROR:", error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    run()

    /*
     * Listen for authentication changes.
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
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setLoggingOut(false)
    }
  }

  const filteredMentions = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return mentions

    return mentions.filter((mention) => {
      return (
        mention.content?.toLowerCase().includes(term) ||
        mention.platform?.toLowerCase().includes(term) ||
        mention.sentiment?.toLowerCase().includes(term)
      )
    })
  }, [mentions, search])

  const positive = mentions.filter(
    (m) => m.sentiment?.toLowerCase() === "positive"
  ).length

  const negative = mentions.filter(
    (m) => m.sentiment?.toLowerCase() === "negative"
  ).length

  const neutral = mentions.filter(
    (m) => m.sentiment?.toLowerCase() === "neutral"
  ).length

  const alerts = mentions.filter(
    (m) => m.is_negative_alert
  ).length

  const fullName =
    politician?.full_name ||
    politician?.name ||
    "Political Leader"

  const party =
    politician?.political_party ||
    politician?.party ||
    "Independent"

  const firstName = fullName.split(" ")[0] || "there"

  const plan = politician?.plan
    ? politician.plan.charAt(0).toUpperCase() +
      politician.plan.slice(1)
    : "Basic"

  const mentionLimit =
    entitlement?.mentions_limit ?? 100

  const usagePercentage =
    mentionLimit > 0
      ? Math.min((mentions.length / mentionLimit) * 100, 100)
      : 0

  const sentimentTotal = positive + negative + neutral

  const sentimentScore =
    sentimentTotal > 0
      ? Math.round(
          ((positive - negative) / sentimentTotal) * 100
        )
      : 0

  if (!checked || loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-white/10 border-t-[#00ff66] animate-spin" />

          <h2 className="mt-5 font-semibold">
            Loading your intelligence...
          </h2>

          <p className="mt-2 text-sm text-white/40">
            Securing your political intelligence workspace.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* =====================================================
          TOP NAVIGATION
      ===================================================== */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/90 backdrop-blur-xl">

        <div className="max-w-7xl mx-auto px-4 md:px-6">

          <div className="h-16 flex items-center justify-between">

            {/* LOGO */}
            <Link
              href="/"
              className="text-xl font-black tracking-tight"
            >
              LEAD<span className="text-[#00ff66]">.</span>
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center gap-7 text-sm">

              <Link
                href="/dashboard"
                className="text-[#00ff66] font-semibold"
              >
                Dashboard
              </Link>

              <Link
                href="/"
                className="text-white/50 hover:text-white transition"
              >
                Intelligence
              </Link>

              <Link
                href="/"
                className="text-white/50 hover:text-white transition"
              >
                Reports
              </Link>

              <Link
                href="/"
                className="text-white/50 hover:text-white transition"
              >
                Alerts
              </Link>

            </nav>

            {/* ACCOUNT */}
            <div className="hidden md:flex items-center gap-4">

              <div className="text-right">
                <p className="text-xs font-semibold">
                  {fullName}
                </p>

                <p className="text-[10px] text-white/35">
                  {email}
                </p>
              </div>

              <button
                onClick={logout}
                disabled={loggingOut}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs transition disabled:opacity-50"
              >
                {loggingOut ? "..." : "Logout"}
              </button>

            </div>

            {/* MOBILE MENU */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden px-3 py-2 rounded-xl bg-white/10 text-sm"
            >
              Menu
            </button>

          </div>

          {mobileMenu && (
            <div className="md:hidden border-t border-white/10 py-4 space-y-2">

              <Link
                href="/dashboard"
                className="block px-4 py-3 rounded-xl bg-white/5"
              >
                Dashboard
              </Link>

              <Link
                href="/"
                className="block px-4 py-3 rounded-xl bg-white/5"
              >
                Intelligence
              </Link>

              <Link
                href="/"
                className="block px-4 py-3 rounded-xl bg-white/5"
              >
                Reports
              </Link>

              <button
                onClick={logout}
                className="w-full text-left px-4 py-3 rounded-xl bg-white/5"
              >
                Logout
              </button>

            </div>
          )}

        </div>
      </header>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* HERO */}
        <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">

          <div>

            <div className="flex items-center gap-2">

              <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />

              <span className="text-[11px] uppercase tracking-[0.2em] text-[#00ff66] font-bold">
                Intelligence Online
              </span>

            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-3">
              Good to see you, {firstName}.
            </h1>

            <p className="text-white/45 text-sm md:text-base mt-3 max-w-2xl">
              Your political intelligence command center for monitoring
              mentions, sentiment and emerging public signals.
            </p>

          </div>

          <div className="flex flex-col sm:flex-row gap-2">

            <div className="relative">

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search intelligence..."
                className="w-full sm:w-[240px] px-4 py-3 rounded-xl bg-[#111] border border-white/10 text-sm outline-none focus:border-[#00ff66]/50 transition"
              />

            </div>

            <Link
              href="/admin"
              className="px-5 py-3 rounded-xl bg-[#00ff66] text-black font-bold text-sm text-center hover:opacity-90 transition"
            >
              + Manage
            </Link>

          </div>

        </section>

        {/* =====================================================
            PROFILE / STATUS
        ===================================================== */}
        <section className="mt-8 p-5 md:p-6 rounded-2xl bg-[#0d0d0d] border border-white/10">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-2xl bg-[#00ff66]/10 border border-[#00ff66]/20 flex items-center justify-center text-xl font-black text-[#00ff66]">
                {fullName.charAt(0).toUpperCase()}
              </div>

              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <h2 className="font-bold text-lg">
                    {fullName}
                  </h2>

                  <span className="px-2.5 py-1 rounded-full bg-[#00ff66]/10 text-[#00ff66] text-[9px] uppercase font-bold">
                    {plan}
                  </span>

                </div>

                <p className="text-xs text-white/40 mt-1">
                  {politician?.position || "Political Leader"} • {party}
                </p>

              </div>

            </div>

            <div className="grid grid-cols-3 gap-2">

              <div className="px-4 py-3 rounded-xl bg-black/30 text-center">
                <p className="text-[9px] uppercase text-white/30">
                  County
                </p>
                <p className="text-xs font-semibold mt-1">
                  {politician?.county || "—"}
                </p>
              </div>

              <div className="px-4 py-3 rounded-xl bg-black/30 text-center">
                <p className="text-[9px] uppercase text-white/30">
                  Constituency
                </p>
                <p className="text-xs font-semibold mt-1">
                  {politician?.constituency || "—"}
                </p>
              </div>

              <div className="px-4 py-3 rounded-xl bg-black/30 text-center">
                <p className="text-[9px] uppercase text-white/30">
                  Ward
                </p>
                <p className="text-xs font-semibold mt-1">
                  {politician?.ward || "—"}
                </p>
              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            KPI CARDS
        ===================================================== */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-5">

          <div className="p-5 rounded-2xl bg-[#111] border border-white/10">

            <p className="text-[10px] uppercase tracking-wider text-white/35">
              Mentions
            </p>

            <p className="text-3xl font-black mt-2">
              {mentions.length}
            </p>

            <p className="text-[10px] text-white/30 mt-1">
              of {mentionLimit} available
            </p>

          </div>

          <div className="p-5 rounded-2xl bg-[#111] border border-white/10">

            <p className="text-[10px] uppercase tracking-wider text-white/35">
              Positive
            </p>

            <p className="text-3xl font-black text-[#00ff66] mt-2">
              {positive}
            </p>

            <p className="text-[10px] text-white/30 mt-1">
              favorable signals
            </p>

          </div>

          <div className="p-5 rounded-2xl bg-[#111] border border-white/10">

            <p className="text-[10px] uppercase tracking-wider text-white/35">
              Negative
            </p>

            <p className="text-3xl font-black text-red-400 mt-2">
              {negative}
            </p>

            <p className="text-[10px] text-white/30 mt-1">
              risk signals
            </p>

          </div>

          <div className="p-5 rounded-2xl bg-[#111] border border-white/10">

            <p className="text-[10px] uppercase tracking-wider text-white/35">
              Alerts
            </p>

            <p className="text-3xl font-black mt-2">
              {alerts}
            </p>

            <p className="text-[10px] text-white/30 mt-1">
              priority signals
            </p>

          </div>

          <div className="p-5 rounded-2xl bg-[#111] border border-white/10 col-span-2 lg:col-span-1">

            <p className="text-[10px] uppercase tracking-wider text-white/35">
              Sentiment
            </p>

            <p className="text-3xl font-black mt-2">
              {sentimentScore > 0 ? "+" : ""}
              {sentimentScore}
            </p>

            <p className="text-[10px] text-white/30 mt-1">
              overall signal
            </p>

          </div>

        </section>

        {/* =====================================================
            MAIN INTELLIGENCE GRID
        ===================================================== */}
        <section className="grid lg:grid-cols-3 gap-5 mt-5">

          {/* MENTIONS FEED */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#111] border border-white/10">

            <div className="flex items-start justify-between gap-4">

              <div>
                <h2 className="font-bold text-lg">
                  Live Intelligence Feed
                </h2>

                <p className="text-xs text-white/35 mt-1">
                  Latest signals connected to your profile.
                </p>
              </div>

              <div className="flex items-center gap-2">

                <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />

                <span className="text-[10px] uppercase text-[#00ff66] font-bold">
                  Live
                </span>

              </div>

            </div>

            {filteredMentions.length === 0 ? (

              <div className="py-16 text-center">

                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
                  📡
                </div>

                <h3 className="font-bold mt-5">
                  Intelligence feed is ready
                </h3>

                <p className="text-sm text-white/40 mt-2 max-w-md mx-auto">
                  Mentions connected to your political profile will appear
                  here as the monitoring engine collects them.
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
                      className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <div className="flex items-center gap-2">

                            <span className="text-[10px] uppercase text-white/35">
                              {mention.platform || "Source"}
                            </span>

                            <span className="text-white/10">
                              •
                            </span>

                            <span className="text-[10px] text-white/30">
                              Recent
                            </span>

                          </div>

                          <p className="text-sm mt-2 line-clamp-2 text-white/75">
                            {mention.content ||
                              "Political mention detected."}
                          </p>

                        </div>

                        <span
                          className={`shrink-0 px-2.5 py-1.5 rounded-full text-[10px] uppercase font-bold ${
                            sentiment === "positive"
                              ? "bg-[#00ff66]/10 text-[#00ff66]"
                              : sentiment === "negative"
                              ? "bg-red-500/10 text-red-400"
                              : sentiment === "neutral"
                              ? "bg-white/10 text-white/50"
                              : "bg-white/5 text-white/30"
                          }`}
                        >
                          {sentiment}
                        </span>

                      </div>

                    </div>
                  )
                })}

              </div>

            )}

          </div>

          {/* RIGHT INTELLIGENCE PANEL */}
          <div className="space-y-5">

            {/* SENTIMENT */}
            <div className="p-6 rounded-2xl bg-[#111] border border-white/10">

              <p className="text-[10px] uppercase tracking-widest text-white/35">
                Sentiment Overview
              </p>

              <h2 className="text-2xl font-black mt-2">
                {sentimentScore >= 0 ? "+" : ""}
                {sentimentScore}
              </h2>

              <p className="text-xs text-white/35 mt-1">
                Based on classified mentions
              </p>

              <div className="mt-6 h-2 rounded-full bg-white/5 overflow-hidden">

                <div
                  className="h-full bg-[#00ff66] rounded-full transition-all"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        50 + sentimentScore / 2
                      )
                    )}%`,
                  }}
                />

              </div>

              <div className="grid grid-cols-3 gap-2 mt-5">

                <div>
                  <p className="text-[10px] text-white/30">
                    Positive
                  </p>
                  <p className="font-bold text-[#00ff66]">
                    {positive}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-white/30">
                    Neutral
                  </p>
                  <p className="font-bold">
                    {neutral}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-white/30">
                    Negative
                  </p>
                  <p className="font-bold text-red-400">
                    {negative}
                  </p>
                </div>

              </div>

            </div>

            {/* PLAN */}
            <div className="p-6 rounded-2xl bg-[#111] border border-white/10">

              <div className="flex justify-between items-start">

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/35">
                    Current Plan
                  </p>

                  <h2 className="text-2xl font-black mt-2">
                    {plan}
                  </h2>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[#00ff66]/10 text-[#00ff66] text-[9px] uppercase font-bold">
                  Active
                </span>

              </div>

              <div className="mt-6">

                <div className="flex justify-between text-xs">

                  <span className="text-white/40">
                    Mention usage
                  </span>

                  <span>
                    {mentions.length}/{mentionLimit}
                  </span>

                </div>

                <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">

                  <div
                    className="h-full bg-[#00ff66] rounded-full"
                    style={{
                      width: `${usagePercentage}%`,
                    }}
                  />

                </div>

              </div>

              <div className="mt-5 space-y-3 text-xs">

                <div className="flex justify-between">
                  <span className="text-white/40">
                    Ward Intelligence
                  </span>

                  <span>
                    {entitlement?.ward_intel
                      ? "Enabled"
                      : "Upgrade"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">
                    AI Briefing
                  </span>

                  <span>
                    {entitlement?.ai_briefing
                      ? "Enabled"
                      : "Upgrade"}
                  </span>
                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            QUICK ACTIONS
        ===================================================== */}
        <section className="mt-5">

          <div className="flex items-center justify-between mb-3">

            <div>
              <h2 className="font-bold">
                Command Center
              </h2>

              <p className="text-xs text-white/35 mt-1">
                Manage your political intelligence workspace.
              </p>
            </div>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">

            <Link
              href="/welcome"
              className="group p-5 rounded-2xl bg-[#111] border border-white/10 hover:border-[#00ff66]/30 transition"
            >
              <div className="text-xl">
                👤
              </div>

              <h3 className="font-bold mt-4">
                Political Profile
              </h3>

              <p className="text-xs text-white/35 mt-1">
                Update your political identity and profile.
              </p>

              <span className="inline-block mt-4 text-xs text-[#00ff66] group-hover:translate-x-1 transition">
                Manage →
              </span>
            </Link>

            <Link
              href="/"
              className="group p-5 rounded-2xl bg-[#111] border border-white/10 hover:border-[#00ff66]/30 transition"
            >
              <div className="text-xl">
                📊
              </div>

              <h3 className="font-bold mt-4">
                Intelligence
              </h3>

              <p className="text-xs text-white/35 mt-1">
                Explore political monitoring and signals.
              </p>

              <span className="inline-block mt-4 text-xs text-[#00ff66] group-hover:translate-x-1 transition">
                Explore →
              </span>
            </Link>

            <Link
              href="/"
              className="group p-5 rounded-2xl bg-[#111] border border-white/10 hover:border-[#00ff66]/30 transition"
            >
              <div className="text-xl">
                🚨
              </div>

              <h3 className="font-bold mt-4">
                Alerts
              </h3>

              <p className="text-xs text-white/35 mt-1">
                Monitor important political signals.
              </p>

              <span className="inline-block mt-4 text-xs text-[#00ff66] group-hover:translate-x-1 transition">
                View →
              </span>
            </Link>

            <Link
              href="/admin"
              className="group p-5 rounded-2xl bg-[#111] border border-white/10 hover:border-[#00ff66]/30 transition"
            >
              <div className="text-xl">
                ⚙️
              </div>

              <h3 className="font-bold mt-4">
                Management
              </h3>

              <p className="text-xs text-white/35 mt-1">
                Configure your political tracking workspace.
              </p>

              <span className="inline-block mt-4 text-xs text-[#00ff66] group-hover:translate-x-1 transition">
                Open →
              </span>
            </Link>

          </div>

        </section>

        {/* FOOTER STATUS */}
        <div className="mt-8 pb-4 flex flex-col sm:flex-row justify-between gap-2 text-[10px] text-white/25">

          <span>
            LEAD Political Intelligence Platform
          </span>

          <span>
            Secure session • Monitoring workspace active
          </span>

        </div>

      </main>
    </div>
  )
}