"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const counties = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
]

const positions = [
  "MCA",
  "MP",
  "Senator",
  "Governor",
  "Woman Rep",
  "Speaker",
  "Other",
]

const parties = [
  "UDA",
  "ODM",
  "Jubilee",
  "Wiper",
  "DAP-K",
  "Independent",
  "Other",
]

export default function Register() {
  const router = useRouter()

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
    party: "",
    position: "MCA",
    county: "",
    constituency: "",
    ward: "",
    terms: false,
    privacy: false,
  })

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError("")

    if (form.name.trim().length < 3) {
      setError("Enter your full name.")
      return
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (
      form.password.length < 8 ||
      !/[A-Z]/.test(form.password) ||
      !/\d/.test(form.password) ||
      !/[^A-Za-z0-9]/.test(form.password)
    ) {
      setError(
        "Password must contain 8+ characters, uppercase letter, number and symbol."
      )
      return
    }

    if (!form.terms || !form.privacy) {
      setError(
        "You must accept the Terms and Privacy Policy."
      )
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          username: form.username,
          password: form.password,
          party: form.party,
          position: form.position,
          county: form.county,
          constituency: form.constituency,
          ward: form.ward,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registration failed.")
        return
      }

      router.push(
        `/login?registered=1&email=${encodeURIComponent(
          form.email
        )}`
      )
    } catch {
      setError(
        "Unable to connect to the server. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white px-4 py-8">
      <div className="mx-auto max-w-[650px]">
        <div className="text-center">
          <div className="mx-auto w-11 h-11 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-black">
            P
          </div>

          <h1 className="mt-4 text-2xl sm:text-3xl font-bold">
            Create Your Private Tracker
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Secure political intelligence account
          </p>

          <p className="mt-1 text-xs text-white/30">
            Subscription is activated only after verified payment.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-8 bg-[#111] border border-white/10 rounded-2xl p-5 sm:p-8"
        >
          <div className="mb-7">
            <div className="flex justify-between text-xs text-white/40">
              <span>Political Identity</span>
              <span>Account Security</span>
            </div>

            <div className="mt-2 h-1 rounded-full bg-white/10">
              <div className="h-1 w-full rounded-full bg-[#00ff66]" />
            </div>
          </div>

          <div className="space-y-5">
            <input
              required
              value={form.name}
              onChange={(e) =>
                update("name", e.target.value)
              }
              placeholder="Full Name"
              className="w-full px-4 py-3 rounded-xl bg-black border border-white/10"
            />

            <input
              required
              type="email"
              value={form.email}
              onChange={(e) =>
                update("email", e.target.value)
              }
              placeholder="Email Address"
              className="w-full px-4 py-3 rounded-xl bg-black border border-white/10"
            />

            <input
              required
              value={form.phone}
              onChange={(e) =>
                update("phone", e.target.value)
              }
              placeholder="Phone Number — 07XXXXXXXX"
              className="w-full px-4 py-3 rounded-xl bg-black border border-white/10"
            />

            <input
              value={form.username}
              onChange={(e) =>
                update("username", e.target.value)
              }
              placeholder="Username"
              className="w-full px-4 py-3 rounded-xl bg-black border border-white/10"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={form.party}
                onChange={(e) =>
                  update("party", e.target.value)
                }
                className="px-4 py-3 rounded-xl bg-black border border-white/10"
              >
                <option value="">Political Party</option>
                {parties.map((party) => (
                  <option key={party}>{party}</option>
                ))}
              </select>

              <select
                value={form.position}
                onChange={(e) =>
                  update("position", e.target.value)
                }
                className="px-4 py-3 rounded-xl bg-black border border-white/10"
              >
                {positions.map((position) => (
                  <option key={position}>{position}</option>
                ))}
              </select>
            </div>

            <select
              required
              value={form.county}
              onChange={(e) =>
                update("county", e.target.value)
              }
              className="w-full px-4 py-3 rounded-xl bg-black border border-white/10"
            >
              <option value="">Select County</option>

              {counties.map((county) => (
                <option key={county}>{county}</option>
              ))}
            </select>

            <input
              value={form.constituency}
              onChange={(e) =>
                update("constituency", e.target.value)
              }
              placeholder="Constituency"
              className="w-full px-4 py-3 rounded-xl bg-black border border-white/10"
            />

            <input
              value={form.ward}
              onChange={(e) =>
                update("ward", e.target.value)
              }
              placeholder="Ward"
              className="w-full px-4 py-3 rounded-xl bg-black border border-white/10"
            />

            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  update("password", e.target.value)
                }
                placeholder="Password"
                className="w-full px-4 py-3 pr-16 rounded-xl bg-black border border-white/10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-3 top-3 text-xs text-white/50"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <input
              required
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) =>
                update("confirmPassword", e.target.value)
              }
              placeholder="Confirm Password"
              className="w-full px-4 py-3 rounded-xl bg-black border border-white/10"
            />

            <label className="flex gap-3 text-sm text-white/60">
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(e) =>
                  update("terms", e.target.checked)
                }
              />

              <span>
                I agree to the Terms & Conditions.
              </span>
            </label>

            <label className="flex gap-3 text-sm text-white/60">
              <input
                type="checkbox"
                checked={form.privacy}
                onChange={(e) =>
                  update("privacy", e.target.checked)
                }
              />

              <span>
                I agree to the Privacy Policy.
              </span>
            </label>
          </div>

          {error && (
            <div className="mt-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="mt-6 w-full py-3.5 rounded-xl bg-[#00ff66] text-black font-bold disabled:opacity-50"
          >
            {loading
              ? "Creating secure account..."
              : "Create Private Tracker →"}
          </button>

          <div className="mt-5 text-center text-sm text-white/40">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-white underline"
            >
              Login
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}