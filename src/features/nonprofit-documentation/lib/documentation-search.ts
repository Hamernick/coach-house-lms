import type {
  DocumentationSearchDocument,
  DocumentationSearchResult,
} from "../search-types"

export const DOCUMENTATION_SEARCH_QUERY_LIMIT = 160

export function sanitizeDocumentationQuery(value: unknown): string {
  return typeof value === "string"
    ? value
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, DOCUMENTATION_SEARCH_QUERY_LIMIT)
    : ""
}

function normalize(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
}

function words(value: string): string[] {
  return normalize(value).match(/[\p{L}\p{N}]+/gu) ?? []
}

function matchCount(tokens: string[], value: string) {
  const candidates = words(value)
  return tokens.filter((token) =>
    candidates.some(
      (word) => word === token || (token.length >= 3 && word.startsWith(token))
    )
  ).length
}

function excerpt(value: string, tokens: string[]) {
  const text = value.replace(/\s+/g, " ").trim()
  if (text.length <= 190) return text
  const normalized = normalize(text)
  const matches = tokens
    .map((token) => normalized.indexOf(token))
    .filter((index) => index >= 0)
  const firstMatch = matches.length ? Math.min(...matches) : 0
  const start = Math.max(0, firstMatch - 45)
  const wordStart = start > 0 ? text.lastIndexOf(" ", start) + 1 : 0
  const end = Math.min(text.length, wordStart + 190)
  const wordEnd = end < text.length ? text.lastIndexOf(" ", end) : end
  return `${wordStart ? "…" : ""}${text.slice(wordStart, Math.max(wordEnd, wordStart + 1))}${end < text.length ? "…" : ""}`
}

export function searchDocumentation(
  documents: DocumentationSearchDocument[],
  value: unknown
): DocumentationSearchResult[] {
  const tokens = [...new Set(words(sanitizeDocumentationQuery(value)))]
  if (!tokens.length) return []

  return documents
    .flatMap((document) => {
      const allContent = [
        document.title,
        document.description,
        ...document.sections.flatMap((item) => [item.title, item.text]),
      ].join(" ")
      if (matchCount(tokens, allContent) !== tokens.length) return []

      const titleMatches = matchCount(tokens, document.title)
      const descriptionMatches = matchCount(tokens, document.description)
      const sections = document.sections
        .map((item, index) => ({
          ...item,
          index,
          score:
            matchCount(tokens, item.title) * 8 +
            matchCount(tokens, item.text) * 2,
        }))
        .sort((a, b) => b.score - a.score || a.index - b.index)
      const best = sections[0]
      const titleMatch = titleMatches === tokens.length
      const normalizedTitle = words(document.title).join(" ")
      const exactTitle = normalizedTitle === tokens.join(" ")
      const anchor = !titleMatch && best?.id && best.score > 0 ? best.id : null

      return [
        {
          score:
            (exactTitle ? 100 : 0) +
            titleMatches * 16 +
            descriptionMatches * 5 +
            (best?.score ?? 0),
          result: {
            href: `${document.href}${anchor ? `#${anchor}` : ""}`,
            title: document.title,
            category: document.category,
            sectionTitle: anchor ? best.title : null,
            excerpt: excerpt(
              titleMatch
                ? document.description
                : best?.text || document.description,
              tokens
            ),
          },
        },
      ]
    })
    .sort(
      (a, b) =>
        b.score - a.score || a.result.title.localeCompare(b.result.title, "en")
    )
    .map(({ result }) => result)
}
