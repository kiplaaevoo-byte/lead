import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_POSITIONS = [
  "MCA",
  "MP",
  "Senator",
  "Governor",
  "Woman Rep",
  "Speaker",
  "Other",
]

const ALLOWED_PARTIES = [
  "UDA",
  "ODM",
  "Jubilee",
  "Wiper",
  "DAP-K",
  "Independent",
  "Other",
]

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validPhone(phone: string) {
  return /^(?:\+254|0)7\d{8}$/.test(phone.replace(/\s+/g, ""))
}

function validPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      name,
      email,
      phone,
      username,
      password,
      county,
      constituency,
      ward,
      position,
      party,
    } = body

    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Enter your full name." },
        { status: 400 }
      )
    }

    if (!email || !validEmail(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      )
    }

    if (!phone || !validPhone(phone)) {
      return NextResponse.json(
        { error: "Enter a valid Kenyan phone number." },
        { status: 400 }
      )
    }

    if (!password || !validPassword(password)) {
      return NextResponse.json(
        {
          error:
            "Password must contain at least 8 characters, one uppercase letter, one number and one symbol.",
        },
        { status: 400 }
      )
    }

    if (!position || !ALLOWED_POSITIONS.includes(position)) {
      return NextResponse.json(
        { error: "Select a valid political position." },
        { status: 400 }
      )
    }

    if (party && !ALLOWED_PARTIES.includes(party)) {
      return NextResponse.json(
        { error: "Select a valid political party." },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanPhone = phone.replace(/\s+/g, "")
    const cleanUsername = username?.trim().toLowerCase() || null

    // ---------------------------------------------------------
    // DUPLICATE CHECKS
    // ---------------------------------------------------------

    const { data: phoneExists } = await supabaseAdmin
      .from("politicians")
      .select("id")
      .eq("phone", cleanPhone)
      .eq("is_demo", false)
      .maybeSingle()

    if (phoneExists) {
      return NextResponse.json(
        { error: "Phone number is already registered." },
        { status: 409 }
      )
    }

    if (cleanUsername) {
      const { data: usernameExists } = await supabaseAdmin
        .from("politicians")
        .select("id")
        .eq("username", cleanUsername)
        .maybeSingle()

      if (usernameExists) {
        return NextResponse.json(
          { error: "Username is already taken." },
          { status: 409 }
        )
      }
    }

    // ---------------------------------------------------------
    // SUPABASE AUTH
    // ---------------------------------------------------------

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: false,
        user_metadata: {
          name: name.trim(),
          phone: cleanPhone,
        },
      })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Unable to create account." },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // ---------------------------------------------------------
    // POLITICIAN PROFILE
    // ---------------------------------------------------------

    const { error: politicianError } = await supabaseAdmin
      .from("politicians")
      .insert({
        id: userId,

        // IMPORTANT:
        // Keep this if your current V2 table contains user_id.
        user_id: userId,

        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,

        username: cleanUsername,

        county: county || null,
        constituency: constituency || null,
        ward: ward || null,

        position,
        political_party: party || null,

        is_demo: false,

        onboarding_complete: false,

        // Legacy field intentionally left unused.
        // Supabase Auth now owns passwords.
        password_hash: null,
      })

    if (politicianError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)

      return NextResponse.json(
        { error: politicianError.message },
        { status: 500 }
      )
    }

    // ---------------------------------------------------------
    // DO NOT ACTIVATE A PAID SUBSCRIPTION HERE
    // ---------------------------------------------------------
    //
    // Payment must happen first:
    //
    // payment initiated
    // → provider verification
    // → subscription active
    // → entitlements
    //
    // Therefore registration does NOT grant paid access.

    return NextResponse.json({
      ok: true,
      user_id: userId,
      email: cleanEmail,
      message:
        "Account created. Please check your email to verify your account.",
    })
  } catch (error: any) {
    console.error("REGISTER ERROR:", error)

    return NextResponse.json(
      { error: "Unable to complete registration." },
      { status: 500 }
    )
  }
}