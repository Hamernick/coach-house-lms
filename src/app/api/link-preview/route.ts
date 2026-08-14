import { NextResponse } from "next/server"

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
  void req
  return NextResponse.json(
    { error: "Link previews are unavailable." },
    { status: 410 }
  )
}
