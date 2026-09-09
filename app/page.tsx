"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const features = [
  {
    icon: "📡",
    title: "Mention Monitoring",
    desc: "Track where your name appears across configured public sources.",
  },
  {
    icon: "📈",
    title: "Sentiment Analysis",
    desc: "Positive / Neutral / Negative breakdown from your data.",
  },
  {
    icon: "🗺️",
    title: "County Intelligence",
    desc: "See where conversations are happening by county.",
  },
  {
    icon: "🔒",
    title: "Private by Design",
    desc: "Only you see your dashboard. No public ranking or listing.",
  },
]

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setLoggedIn(!!data.session)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[#00ff66]/5 blur-[140px]" />
        <div className="absolute bottom-[-300px] right-[-200px] w-[600px] h-[600px] rounded-full bg-green-500/5 blur-[130px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00ff66] text-black flex items-center justify-center font-black">
              PT
            </div>

            <div>
              <div className="font-black tracking-tight">
                POLITICAL TRACKER<span className="text-[#00ff66]">.KE</span>
              </div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-white/40">
                Political Intelligence
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {loggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-2.5 rounded-xl bg-[#00ff66] text-black text-sm font-bold hover:bg-[#22ff7b] transition"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="px-4 py-2.5 rounded-xl bg-[#00ff66] text-black text-sm font-bold hover:bg-[#22ff7b] transition"
                >
                  Create Profile
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 pt-20 md:pt-32 pb-20">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00ff66]/20 bg-[#00ff66]/5 text-[#00ff66] text-xs font-semibold mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]" />
            PRIVATE POLITICAL INTELLIGENCE
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-[0.95]">
            Your political intelligence
            <br />
            <span className="text-[#00ff66]">command center.</span>
          </h1>

          <p className="mt-7 text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed">
            Monitor mentions, sentiment, alerts and signals connected to your
            profile — privately. Built for leaders who need real-time awareness
            without the noise.
          </p>

          <div className="mt-3 text-xs text-white/40">
            Private dashboard • County intelligence • AI briefing • No public
            profile
          </div>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link
              href={loggedIn ? "/dashboard" : "/register"}
              className="px-6 py-4 rounded-2xl bg-[#00ff66] text-black font-black text-center hover:bg-[#22ff7b] transition shadow-[0_0_40px_rgba(0,255,102,0.12)]"
            >
              {loggedIn ? "Open Dashboard →" : "Create Private Profile →"}
            </Link>

            <Link
              href={loggedIn ? "/dashboard" : "/login"}
              className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 font-semibold text-center hover:bg-white/10 transition"
            >
              {loggedIn ? "View Intelligence" : "Sign In"}
            </Link>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["🔒", "Private Dashboard"],
            ["📊", "Data-Driven"],
            ["🗺️", "County Intelligence"],
            ["🤖", "AI Ready"],
          ].map(([icon, text]) => (
            <div
              key={text}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
            >
              <div className="text-xl">{icon}</div>
              <div className="mt-2 text-xs font-semibold text-white/60">
                {text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 border-y border-white/10 bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-20">
          <div className="max-w-2xl mb-12">
            <div className="text-[#00ff66] text-xs font-bold uppercase tracking-[0.25em]">
              Intelligence Layer
            </div>

            <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight">
              Know what is happening around your political profile.
            </h2>

            <p className="mt-4 text-white/50 leading-relaxed">
              Political Tracker brings your configured intelligence signals
              into one private command center.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:border-[#00ff66]/20 hover:bg-white/[0.05] transition"
              >
                <div className="text-3xl">{feature.icon}</div>

                <h3 className="mt-6 font-bold text-lg">{feature.title}</h3>

                <p className="mt-3 text-sm text-white/45 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <div className="text-[#00ff66] text-xs font-bold uppercase tracking-[0.25em]">
              Product Preview
            </div>

            <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">
              A private intelligence workspace.
            </h2>
          </div>

          <span className="self-start md:self-auto text-[10px] px-2.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/60 font-bold tracking-wider">
            DEMO PREVIEW
          </span>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#090909] overflow-hidden shadow-2xl">
          {/* Mock dashboard header */}
          <div className="border-b border-white/10 px-5 md:px-7 py-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/40">POLITICAL TRACKER</div>
              <div className="font-bold mt-1">Intelligence Overview</div>
            </div>

            <div className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-white/50">
              DEMO PREVIEW
            </div>
          </div>

          {/* Mock KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-5 md:p-7">
            {[
              ["📡", "Mentions", "Your data"],
              ["📈", "Sentiment", "Your data"],
              ["🚨", "Alerts", "Your data"],
              ["🗺️", "County", "Your profile"],
            ].map(([icon, title, value]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex justify-between">
                  <span className="text-xl">{icon}</span>
                  <span className="text-[9px] text-white/30 uppercase">
                    Preview
                  </span>
                </div>

                <div className="mt-5 text-sm text-white/50">{title}</div>
                <div className="mt-1 font-bold">{value}</div>
              </div>
            ))}
          </div>

          {/* Preview feed */}
          <div className="px-5 md:px-7 pb-7">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-white/40">INTELLIGENCE FEED</div>
                  <div className="font-bold mt-1">Sample briefing</div>
                </div>

                <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-white/50">
                  DEMO PREVIEW
                </span>
              </div>

              <div className="mt-5 rounded-xl bg-white/[0.03] border border-white/5 p-4">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <span>Sample briefing</span>
                  <span>•</span>
                  <span>Demo</span>
                </div>

                <p className="mt-3 text-sm text-white/60 leading-relaxed">
                  This is an example of how configured intelligence signals
                  can appear in your private dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-20">
          <div className="rounded-[2rem] border border-[#00ff66]/10 bg-[#00ff66]/[0.025] p-7 md:p-12">
            <div className="max-w-3xl">
              <div className="text-4xl">🔐</div>

              <h2 className="mt-5 text-3xl md:text-4xl font-black">
                Private by design.
              </h2>

              <p className="mt-4 text-white/50 leading-relaxed">
                Your political intelligence dashboard is designed around
                account-level privacy. Your data is tied to your authenticated
                profile rather than displayed through public leaderboards or
                public politician listings.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  "Authenticated access",
                  "Private dashboard",
                  "No public ranking",
                  "Configured sources",
                ].map((item) => (
                  <span
                    key={item}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60"
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 py-24 text-center">
        <div className="text-[#00ff66] text-xs font-bold uppercase tracking-[0.25em]">
          Political intelligence
        </div>

        <h2 className="mt-4 text-4xl md:text-6xl font-black tracking-tight">
          Build your private command center.
        </h2>

        <p className="mt-5 text-white/50 max-w-xl mx-auto">
          Create your profile and start building your political intelligence
          workspace.
        </p>

        <Link
          href={loggedIn ? "/dashboard" : "/register"}
          className="inline-block mt-8 px-7 py-4 rounded-2xl bg-[#00ff66] text-black font-black hover:bg-[#22ff7b] transition"
        >
          {loggedIn ? "Open Dashboard →" : "Create Private Profile →"}
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-7 flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/30">
          <div>© {new Date().getFullYear()} Political Tracker.ke</div>

          <div className="flex gap-5">
            <Link href="/login" className="hover:text-white transition">
              Login
            </Link>

            <Link href="/register" className="hover:text-white transition">
              Create Profile
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}