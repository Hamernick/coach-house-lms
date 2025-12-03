const BLOCKLISTED_TAGS = ["script", "style", "iframe", "object", "embed", "link", "meta"]
const EVENT_HANDLER_REGEX = /\son\w+="[^"]*"/gi
const JS_PROTOCOL_REGEX = /javascript:/gi

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
  sanitized = sanitized.replace(JS_PROTOCOL_REGEX, "noop:")

  return sanitized
}
