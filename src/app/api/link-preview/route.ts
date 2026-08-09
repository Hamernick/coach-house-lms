import { NextResponse } from "next/server"

const MAX_BYTES = 512_000 // ~0.5MB to avoid huge pages

const LINK_PREVIEW_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  hellip: "…",
  lt: "<",
  mdash: "—",
  nbsp: "\u00a0",
  ndash: "–",
  quot: '"',
}

export function decodeLinkPreviewHtmlEntities(value: string | null) {
  if (!value) return value
  const decodeCodePoint = (codePoint: number, fallback: string) =>
    Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : fallback

  return value.replace(
    /&(#(?:x[\da-f]+|\d+)|[a-z]+);/gi,
    (entity, key: string) => {
      if (key.startsWith("#x") || key.startsWith("#X")) {
        return decodeCodePoint(Number.parseInt(key.slice(2), 16), entity)
      }
      if (key.startsWith("#")) {
        return decodeCodePoint(Number.parseInt(key.slice(1), 10), entity)
      }
      return LINK_PREVIEW_HTML_ENTITIES[key.toLowerCase()] ?? entity
    }
  )
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rawUrl = searchParams.get("url")
    if (!rawUrl)
      return NextResponse.json({ error: "Missing url" }, { status: 400 })

    let target: URL
    try {
      target = new URL(rawUrl)
    } catch {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 })
    }

    if (!["http:", "https:"].includes(target.protocol)) {
      return NextResponse.json(
        { error: "Unsupported protocol" },
        { status: 400 }
      )
    }

    const resp = await fetch(target.toString(), {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent": "CoachHouseLinkPreview/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    })

    if (!resp.ok || !resp.body) {
      return NextResponse.json(
        { error: "Unable to fetch url" },
        { status: 502 }
      )
    }

    const reader = resp.body.getReader()
    let received = 0
    const chunks: Uint8Array[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        received += value.byteLength
        if (received > MAX_BYTES) break
        chunks.push(value)
      }
    }
    const html = new TextDecoder("utf-8").decode(Buffer.concat(chunks))

    const pick = (pattern: RegExp) => {
      const match = html.match(pattern)
      return match?.[1]?.trim() ?? null
    }

    const ogTitle =
      pick(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ??
      pick(/<title>([^<]+)<\/title>/i)
    const ogDescription = pick(
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
    )
    const ogImage = pick(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
    )

    return NextResponse.json({
      title: decodeLinkPreviewHtmlEntities(ogTitle),
      description: decodeLinkPreviewHtmlEntities(ogDescription),
      image: decodeLinkPreviewHtmlEntities(ogImage),
    })
  } catch (error) {
    console.error("link-preview error", error)
    return NextResponse.json({ error: "Preview failed" }, { status: 500 })
  }
}
