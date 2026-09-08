import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: politicians, error } = await supabase
      .from("politicians")
      .select("id, name, county, constituency, position")
      .limit(10)

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    if (!politicians?.length) return NextResponse.json({ ok: false, error: "no politicians" })

    const platforms = ["X", "Facebook", "TikTok"] as const
    const templates = [
      (p: any, loc: string) => `${p.name} is doing great work in ${loc}. We appreciate the development.`,
      (p: any, loc: string) => `Youths praising ${p.name} bursary program in ${loc}`,
      (p: any, loc: string) => `${p.name} development project praised in ${loc}`,
      (p: any, loc: string) => `People complaining about roads in ${loc}. ${p.name} should act fast.`,
    ]

    let inserted = 0
    for (const p of politicians) {
      const loc = p.county || p.constituency || "Kenya"
      const platform = platforms[Math.floor(Math.random() * platforms.length)]
      const template = templates[Math.floor(Math.random() * templates.length)]
      const isNegative = template.toString().includes("complaining")
      
      const mention = {
        politician_id: p.id,
        platform,
        text: template(p, loc),
        url: `https://${platform.toLowerCase()}.com/${p.name.replace(/\s/g,'').toLowerCase()}/${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        sentiment: isNegative ? "negative" : "positive",
        likes: Math.floor(Math.random() * 200),
        comments: Math.floor(Math.random() * 50),
        views: Math.floor(Math.random() * 1000),
      }

      const { error: insErr } = await supabase.from("mentions").insert(mention)
      if (!insErr) inserted++
    }

    return NextResponse.json({ ok: true, inserted, politicians: politicians.length })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}