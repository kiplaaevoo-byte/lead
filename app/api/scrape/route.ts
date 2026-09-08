import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: politicians } = await supabase
     .from("politicians")
     .select("id, name, county, constituency")
     .limit(10)

    if (!politicians?.length) {
      return NextResponse.json({ ok: false, error: "no politicians" })
    }

    const platforms: ("X" | "Facebook" | "TikTok")[] = ["X", "Facebook", "TikTok"]
    let inserted = 0

    for (const p of politicians) {
      const loc = p.county || p.constituency || "Kenya"
      const isNegative = Math.random() < 0.25

      const text = isNegative
       ? `People complaining about roads in ${loc}. ${p.name} should act fast.`
        : Math.random() > 0.5
         ? `${p.name} is doing great work in ${loc}. We appreciate the development.`
          : `Youths praising ${p.name} bursary program in ${loc}`

      const { error } = await supabase.from("mentions").insert({
        politician_id: p.id,
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        text,
        url: `https://x.com/${p.id}/${Date.now()}${Math.floor(Math.random()*1000)}`,
        sentiment: isNegative? "negative" : "positive",
        likes: Math.floor(Math.random()*200),
        comments: Math.floor(Math.random()*50),
        views: Math.floor(Math.random()*1000)
      })
      if (!error) inserted++
    }

    return NextResponse.json({ ok: true, inserted })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}