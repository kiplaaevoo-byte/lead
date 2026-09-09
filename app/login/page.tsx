"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const preEmail = searchParams.get("email") || ""

  const [email, setEmail] = useState(preEmail)
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [msg, setMsg] = useState("")
  const [msgType, setMsgType] = useState<"error" | "success" | "info">("info")

  const setMessage = (
    message: string,
    type: "error" | "success" | "info" = "info"
  ) => {
    setMsg(message)
    setMsgType(type)
  }

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.", "error")
      return
    }

    setLoading(true)
    setMsg("")

    try {
      /*
       * Authenticate through Supabase Auth.
       * No localStorage authentication.
       */
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        const errorMessage = error.message.toLowerCase()

        if (
          errorMessage.includes("not confirmed") ||
          errorMessage.includes("email not confirmed") ||
          errorMessage.includes("email_not_confirmed")
        ) {
          setMessage(
            "Your email has not been verified. Check your inbox and verify your email first.",
            "error"
          )
        } else if (
          errorMessage.includes("invalid login credentials")
        ) {
          setMessage(
            "Incorrect email or password.",
            "error"
          )
        } else {
          setMessage(`❌ ${error.message}`, "error")
        }

        setLoading(false)
        return
      }

      if (!data.user) {
        setMessage(
          "Login failed. No authenticated user was returned.",
          "error"
        )
        setLoading(false)
        return
      }

      /*
       * Check that this authenticated user has a real
       * politician profile.
       *
       * is_demo=false keeps Bernard's permanent demo profile
       * completely isolated from real accounts.
       */
      const { data: politician, error: politicianError } =
        await supabase
          .from("politicians")
          .select(
            "id, user_id, name, full_name, email, county, plan, status, onboarding_complete, is_demo"
          )
          .eq("user_id", data.user.id)
          .eq("is_demo", false)
          .maybeSingle()

      if (politicianError) {
        console.error(
          "Politician profile lookup error:",
          politicianError
        )

        /*
         * Sign out if authentication succeeded but the
         * account has no usable politician profile.
         */
        await supabase.auth.signOut()

        setMessage(
          "Your account was authenticated, but your political profile could not be loaded. Please contact support.",
          "error"
        )

        setLoading(false)
        return
      }

      if (!politician) {
        await supabase.auth.signOut()

        setMessage(
          "No political profile is linked to this account. Please complete registration.",
          "error"
        )

        setLoading(false)
        return
      }

      /*
       * Incomplete onboarding → welcome/onboarding.
       */
      if (politician.onboarding_complete === false) {
        router.replace("/welcome")
        return
      }

      /*
       * Completed account → dashboard.
       */
      router.replace("/dashboard")
    } catch (error) {
      console.error("Login error:", error)

      setMessage(
        "Something went wrong while logging in. Please try again.",
        "error"
      )

      setLoading(false)
    }
  }

  const resend = async () => {
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      setMessage("Enter your email address first.", "error")
      return
    }

    setResending(true)
    setMsg("")

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
      })

      if (error) {
        setMessage(`❌ ${error.message}`, "error")
      } else {
        setMessage(
          `Verification email resent to ${cleanEmail}.`,
          "success"
        )
      }
    } catch (error) {
      console.error("Resend verification error:", error)

      setMessage(
        "Unable to resend verification email. Please try again.",
        "error"
      )
    } finally {
      setResending(false)
    }
  }

  const forgot = async () => {
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      setMessage("Enter your email address first.", "error")
      return
    }

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo:
            `${window.location.origin}/reset-password`,
        })

      if (error) {
        setMessage(`❌ ${error.message}`, "error")
        return
      }

      setMessage(
        `Password reset link sent to ${cleanEmail}.`,
        "success"
      )
    } catch (error) {
      console.error("Password reset error:", error)

      setMessage(
        "Unable to send the password reset email. Please try again.",
        "error"
      )
    }
  }

  return (
    <form
      onSubmit={login}
      className="w-full max-w-[420px] bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl"
    >
      {/* HEADER */}
      <div className="mb-6">
        <div className="w-10 h-10 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-black mb-4">
          P
        </div>

        <h1 className="text-2xl font-bold">
          Welcome back
        </h1>

        <p className="mt-2 text-sm text-white/50">
          Sign in to your Political Tracker account.
        </p>
      </div>

      {/* EMAIL */}
      <label className="block text-xs text-white/50 mb-2">
        EMAIL ADDRESS
      </label>

      <input
        required
        type="email"
        autoComplete="email"
        className="w-full px-4 py-3 rounded-xl bg-black border border-white/10 outline-none focus:border-[#00ff66]/50 transition"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />

      {/* PASSWORD */}
      <label className="block text-xs text-white/50 mb-2 mt-4">
        PASSWORD
      </label>

      <div className="relative">
        <input
          required
          type={show ? "text" : "password"}
          autoComplete="current-password"
          className="w-full px-4 py-3 pr-16 rounded-xl bg-black border border-white/10 outline-none focus:border-[#00ff66]/50 transition"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />

        <button
          type="button"
          onClick={() => setShow((value) => !value)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50 hover:text-white transition"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>

      {/* LOGIN */}
      <button
        type="submit"
        disabled={loading || resending}
        className="mt-6 w-full py-3.5 rounded-xl bg-[#00ff66] text-black font-bold hover:bg-[#00e65c] disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "Signing in..." : "Login →"}
      </button>

      {/* MESSAGE */}
      {msg && (
        <div
          className={`mt-4 text-sm p-3 rounded-xl border ${
            msgType === "success"
              ? "bg-[#00ff66]/10 border-[#00ff66]/20 text-[#00ff66]"
              : msgType === "error"
              ? "bg-red-500/10 border-red-500/20 text-red-300"
              : "bg-white/10 border-white/10 text-white/70"
          }`}
        >
          <div>{msg}</div>

          {msg.toLowerCase().includes("not verified") && (
            <button
              type="button"
              onClick={resend}
              disabled={resending}
              className="mt-2 underline text-[#00ff66] disabled:opacity-50"
            >
              {resending
                ? "Resending..."
                : "Resend verification email"}
            </button>
          )}
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="mt-5 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={forgot}
          className="text-white/50 hover:text-white underline transition"
        >
          Forgot password?
        </button>

        <Link
          href="/register"
          className="text-[#00ff66] hover:text-[#00ff66]/80 underline transition"
        >
          Create account
        </Link>
      </div>

      {/* SECURITY */}
      <div className="mt-7 pt-5 border-t border-white/10 text-center">
        <p className="text-[10px] text-white/30">
          Secure authentication • Private political intelligence
        </p>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 md:p-6">
      <Suspense
        fallback={
          <div className="w-full max-w-[420px] bg-[#111] border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-8 h-8 mx-auto rounded-full border-2 border-[#00ff66]/30 border-t-[#00ff66] animate-spin" />

            <p className="mt-4 text-sm text-white/50">
              Loading secure login...
            </p>
          </div>
        }
      >
        <LoginInner />
      </Suspense>
    </main>
  )
}