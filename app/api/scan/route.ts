import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const PLATFORMS = ["Facebook", "Instagram", "Threads", "X", "TikTok"] as const

type Platform = typeof PLATFORMS[number]

type LiveMention = {
  politician_id: string
  platform: Platform
  content: string
  sentiment: "positive" | "negative" | "neutral"
  url: string
  external_id?: string
  author?: string
  posted_at?: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function cleanQuery(value: string) {
  return value
    .replace(/[^\p{L}\p{N}@#._ -]/gu, "")
    .trim()
}

function getSearchTerms(pol: any): string[] {
  const terms = [
    pol.name,
    ...(Array.isArray(pol.keywords) ? pol.keywords : []),
  ]

  return [...new Set(
    terms
      .map((x) => cleanQuery(String(x)))
      .filter(Boolean)
  )]
}

/**
 * X / Twitter
 */
async function searchX(
  politicianId: string,
  terms: string[]
): Promise<LiveMention[]> {
  const token = process.env.X_BEARER_TOKEN

  if (!token) return []

  const query = terms
    .map((term) => `"${term}"`)
    .join(" OR ")

  const params = new URLSearchParams({
    query: `(${query}) -is:retweet`,
    max_results: "25",
    "tweet.fields":
      "id,text,created_at,author_id,lang,public_metrics",
    expansions: "author_id",
    "user.fields": "username,name",
  })

  const response = await fetch(
    `https://api.x.com/2/tweets/search/recent?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error("X API error:", error)
    return []
  }

  const json = await response.json()

  const users = new Map(
    (json.includes?.users || []).map((user: any) => [
      user.id,
      user,
    ])
  )

  return (json.data || []).map((post: any) => {
    const user: any = users.get(post.author_id)

    return {
      politician_id: politicianId,
      platform: "X",
      content: post.text,
      sentiment: "neutral",
      external_id: post.id,
      author: user
        ? `@${user.username}`
        : undefined,
      posted_at: post.created_at,
      url: `https://x.com/i/web/status/${post.id}`,
    }
  })
}

/**
 * Threads
 *
 * This expects your Meta/Threads application to have the
 * appropriate permissions and access.
 */
async function searchThreads(
  politicianId: string,
  terms: string[]
): Promise<LiveMention[]> {
  const token = process.env.THREADS_ACCESS_TOKEN

  if (!token) return []

  const results: LiveMention[] = []

  for (const term of terms) {
    const params = new URLSearchParams({
      q: term,
      access_token: token,
    })

    try {
      const response = await fetch(
        `https://graph.threads.net/v1.0/threads/search?${params}`,
        {
          cache: "no-store",
        }
      )

      if (!response.ok) {
        console.error(
          "Threads API error:",
          await response.text()
        )
        continue
      }

      const json = await response.json()

      for (const post of json.data || []) {
        if (!post.text) continue

        results.push({
          politician_id: politicianId,
          platform: "Threads",
          content: post.text,
          sentiment: "neutral",
          external_id: post.id,
          author: post.username,
          posted_at: post.timestamp,
          url:
            post.permalink ||
            `https://www.threads.net/@${post.username}/post/${post.id}`,
        })
      }
    } catch (error) {
      console.error("Threads request failed:", error)
    }
  }

  return results
}

/**
 * TikTok Research API
 *
 * NOTE:
 * Requires approved TikTok Research API access.
 */
async function searchTikTok(
  politicianId: string,
  terms: string[]
): Promise<LiveMention[]> {
  const token = process.env.TIKTOK_ACCESS_TOKEN

  if (!token) return []

  const today = new Date()

  const endDate = today.toISOString().slice(0, 10).replaceAll("-", "")

  const start = new Date(today)
  start.setDate(start.getDate() - 1)

  const startDate = start
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "")

  const results: LiveMention[] = []

  for (const term of terms) {
    try {
      const response = await fetch(
        "https://open.tiktokapis.com/v2/research/video/query/?fields=id,video_description,create_time,username,like_count,comment_count,share_count,view_count,hashtag_names",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: {
              and: [
                {
                  operation: "EQ",
                  field_name: "keyword",
                  field_values: [term],
                },
              ],
            },
            max_count: 25,
            start_date: startDate,
            end_date: endDate,
            is_random: false,
          }),
          cache: "no-store",
        }
      )

      if (!response.ok) {
        console.error(
          "TikTok API error:",
          await response.text()
        )
        continue
      }

      const json = await response.json()

      for (const video of json.data?.videos || []) {
        results.push({
          politician_id: politicianId,
          platform: "TikTok",
          content: video.video_description || "",
          sentiment: "neutral",
          external_id: String(video.id),
          author: video.username,
          posted_at: video.create_time
            ? new Date(
                video.create_time * 1000
              ).toISOString()
            : undefined,
          url: `https://www.tiktok.com/@${video.username}/video/${video.id}`,
        })
      }
    } catch (error) {
      console.error("TikTok request failed:", error)
    }
  }

  return results
}

/**
 * Facebook / Instagram
 *
 * These require Meta-approved access and are intentionally
 * isolated so one unavailable Meta endpoint doesn't kill
 * the entire scan.
 */
async function searchMeta(
  platform: "Facebook" | "Instagram",
  politicianId: string,
  terms: string[]
): Promise<LiveMention[]> {
  const token = process.env.META_ACCESS_TOKEN

  if (!token) return []

  // Add your approved Meta endpoint/query here based on
  // the type of Facebook/Instagram data your application
  // has permission to access.

  console.log(
    `${platform} search requested for`,
    terms
  )

  return []
}

function deduplicateMentions(
  mentions: LiveMention[]
): LiveMention[] {
  const seen = new Set<string>()

  return mentions.filter((mention) => {
    const key =
      `${mention.platform}:${mention.external_id || mention.url}`

    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

async function scanPolitician(pol: any) {
  const terms = getSearchTerms(pol)

  if (!terms.length) {
    return {
      politician_id: pol.id,
      found: 0,
      errors: [],
    }
  }

  const [
    x,
    threads,
    facebook,
    instagram,
    tiktok,
  ] = await Promise.all([
    searchX(pol.id, terms),
    searchThreads(pol.id, terms),
    searchMeta("Facebook", pol.id, terms),
    searchMeta("Instagram", pol.id, terms),
    searchTikTok(pol.id, terms),
  ])

  const mentions = deduplicateMentions([
    ...x,
    ...threads,
    ...facebook,
    ...instagram,
    ...tiktok,
  ])

  if (!mentions.length) {
    return {
      politician_id: pol.id,
      politician: pol.name,
      found: 0,
      mentions: [],
    }
  }

  /*
   * Prevent duplicate posts from being inserted.
   *
   * Ideally add a unique constraint:
   *
   * UNIQUE(platform, external_id)
   */
  const rows = mentions.map((mention) => ({
    politician_id: mention.politician_id,
    platform: mention.platform,
    content: mention.content,
    sentiment: mention.sentiment,
    url: mention.url,
    external_id: mention.external_id || null,
    author: mention.author || null,
    posted_at: mention.posted_at || null,
  }))

  const { error } = await supabase
    .from("mentions")
    .upsert(rows, {
      onConflict: "platform,external_id",
      ignoreDuplicates: true,
    })

  if (error) {
    console.error(
      `Supabase insert error for ${pol.name}:`,
      error
    )

    return {
      politician_id: pol.id,
      politician: pol.name,
      found: mentions.length,
      saved: 0,
      error: error.message,
    }
  }

  return {
    politician_id: pol.id,
    politician: pol.name,
    found: mentions.length,
    saved: mentions.length,
    mentions,
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const politician_id = body.politician_id

    const query = supabase
      .from("politicians")
      .select("*")

    const { data: politicians, error } = politician_id
      ? await query.eq("id", politician_id)
      : await query

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to load politicians",
          details: error.message,
        },
        { status: 500 }
      )
    }

    if (!politicians?.length) {
      return NextResponse.json({
        message: "No politicians",
        scanned: 0,
        found: 0,
      })
    }

    const results = []

    for (const politician of politicians) {
      results.push(
        await scanPolitician(politician)
      )
    }

    const totalFound = results.reduce(
      (sum, result) => sum + (result.found || 0),
      0
    )

    const totalSaved = results.reduce(
      (sum, result) => sum + (result.saved || 0),
      0
    )

    return NextResponse.json({
      success: true,
      scanned: politicians.length,
      found: totalFound,
      saved: totalSaved,
      scanned_at: new Date().toISOString(),
      results,
    })
  } catch (error: any) {
    console.error("SCAN ERROR:", error)

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Scan failed",
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    service: "Political Tracker Live Scanner",
    status: "online",
    message:
      "Use POST /api/scan to run a live social-media scan.",
  })
}
