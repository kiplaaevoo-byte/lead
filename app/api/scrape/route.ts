import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const hfKey = process.env.HF_API_KEY

    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: politicians, error } = await supabase
      .from("politicians")
      .select("id, name")
      .limit(5)

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    if (!politicians || politicians.length === 0) return NextResponse.json({ ok: false, error: "no politicians in db" })

    let inserted = 0
    for (const p of politicians) {
      const { error: insErr } = await supabase.from("mentions").insert({
        politician_id: p.id,
        platform: "X",
        content: `${p.name} development project praised in Bomet`,
        sentiment: "positive",
        sentiment_score: 0.85
      })
      if (!insErr) inserted++
    }

    return NextResponse.json({ ok: true, hasKey: !!hfKey, inserted, politicians: politicians.length })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
