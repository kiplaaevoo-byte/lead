"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Politician = {
  id: string
  user_id?: string
  name?: string
  full_name?: string
  county?: string
  constituency?: string
  ward?: string
  position?: string
  political_party?: string
  plan?: string
  onboarding_complete?: boolean
  is_demo?: boolean
}

export default function Welcome() {
  const router = useRouter()

  const [politician, setPolitician] = useState<Politician | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        /*
         * No authenticated user → login
         */
        if (!user) {
          router.replace("/login")
          return
        }

        /*
         * Load ONLY the real user's politician profile.
         * Bernard/demo remains isolated.
         */
        const { data, error } = await supabase
          .from("politicians")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_demo", false)
          .maybeSingle()

        if (error) {
          console.error("Welcome profile error:", error)
          setLoading(false)
          return
        }

        /*
         * Authenticated account without politician profile.
         */
        if (!data) {
          router.replace("/register")
          return
        }

        /*
         * Already completed onboarding → dashboard.
         */
        if (data.onboarding_complete === true) {
          router.replace("/dashboard")
          return
        }

        setPolitician(data)
        setLoading(false)
      } catch (error) {
        console.error("Welcome error:", error)
        router.replace("/login")
      }
    }

    loadAccount()
  }, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-[#00ff66]/30 border-t-[#00ff66] animate-spin" />

          <p className="mt-4 text-sm text-white/50">
            Loading your account...
          </p>
        </div>
      </div>
    )
  }

  const displayName =
    politician?.full_name ||
    politician?.name ||
    "Political Leader"

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-[520px]">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-black">
              P
            </div>

            <div className="font-black tracking-tight">
              POLITICAL TRACKER
              <span className="text-[#00ff66]">.KE</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="text-xs px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition"
          >
            Logout
          </button>
        </div>

        {/* CARD */}
        <div className="bg-[#111] border border-white/10 rounded-[28px] p-7 md:p-9 text-center shadow-2xl">

          <div className="mx-auto w-16 h-16 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/20 flex items-center justify-center text-3xl">
            🎉
          </div>

          <div className="mt-6 inline-flex px-3 py-1 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66] text-[10px] uppercase tracking-wider">
            Account Created
          </div>

          <h1 className="mt-4 text-3xl md:text-4xl font-black">
            Welcome, {displayName}
          </h1>

          <p className="mt-4 text-sm md:text-base text-white/50 leading-6">
            Your Political Tracker account is ready. Complete your
            workspace setup to start tracking mentions, sentiment,
            signals and political intelligence.
          </p>

          {/* PROFILE SUMMARY */}
          <div className="mt-7 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">
              Political Profile
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">

              <div>
                <div className="text-[10px] text-white/30">
                  POSITION
                </div>

                <div className="mt-1 text-sm font-bold">
                  {politician?.position || "Not set"}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-white/30">
                  PARTY
                </div>

                <div className="mt-1 text-sm font-bold">
                  {politician?.political_party || "Not set"}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-white/30">
                  COUNTY
                </div>

                <div className="mt-1 text-sm font-bold">
                  {politician?.county || "Not set"}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-white/30">
                  PLAN
                </div>

                <div className="mt-1 text-sm font-bold uppercase text-[#00ff66]">
                  {politician?.plan || "Basic"}
                </div>
              </div>

            </div>
          </div>

          {/* NEXT STEP */}
          <div className="mt-6 p-4 rounded-2xl bg-[#00ff66]/5 border border-[#00ff66]/10 text-left">
            <div className="font-bold text-sm">
              Next step
            </div>

            <p className="mt-1 text-xs text-white/50 leading-5">
              Configure your monitoring keywords, topics and
              intelligence preferences before entering your dashboard.
            </p>
          </div>

          {/* ACTIONS */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">

            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-xl bg-[#00ff66] text-black font-bold hover:bg-[#00e65c] transition"
            >
              Go to Dashboard →
            </Link>

            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 transition"
            >
              Login
            </Link>

          </div>

          <p className="mt-6 text-[10px] text-white/25">
            Secure authenticated account • Private political intelligence
          </p>
        </div>
      </div>
    </main>
  )
}