const BLOCKLISTED_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "svg",
  "math",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "base",
  "template",
]
const EVENT_HANDLER_REGEX =
  /\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi
const DANGEROUS_PROTOCOL_REGEX = /(?:javascript|vbscript)\s*:/gi
const URL_ATTRIBUTE_REGEX =
  /\s+(href|src|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi

function decodeNumericHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#([0-9]+);?/g, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
}

export function sanitizeHtml(input: string): string {
  if (!input) return ""
  let sanitized = input

  for (const tag of BLOCKLISTED_TAGS) {
    const pattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi")
    sanitized = sanitized.replace(pattern, "")
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi")
    sanitized = sanitized.replace(selfClosing, "")
  }

  sanitized = sanitized.replace(EVENT_HANDLER_REGEX, "")
  sanitized = sanitized.replace(
    URL_ATTRIBUTE_REGEX,
    (match, attribute: string, doubleValue, singleValue, bareValue) => {
      const value = String(doubleValue ?? singleValue ?? bareValue ?? "")
      const normalized = decodeNumericHtmlEntities(value)
        .replace(/[\u0000-\u0020]+/g, "")
        .toLowerCase()
      if (
        normalized.startsWith("javascript:") ||
        normalized.startsWith("vbscript:") ||
        normalized.startsWith("data:text/html")
      ) {
        return ` ${attribute}="#"`
      }
      return match
    },
  )
  sanitized = sanitized.replace(DANGEROUS_PROTOCOL_REGEX, "noop:")

  return sanitized
}
