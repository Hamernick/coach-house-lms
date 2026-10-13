import cleanHtml from "sanitize-html"

const RICH_TEXT_TAGS = [
  "p",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "code",
  "hr",
  "br",
  "ol",
  "ul",
  "li",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "del",
  "u",
  "sub",
  "sup",
  "span",
  "mark",
  "a",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "img",
]

const SAFE_COLOR =
  /^(?:#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%a-z]+\)|[a-z]+)$/i

const RICH_TEXT_OPTIONS: cleanHtml.IOptions = {
  allowedTags: RICH_TEXT_TAGS,
  allowedAttributes: {
    a: ["href", "target", "rel", "class"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    ol: ["start", "type", "class"],
    ul: ["class"],
    p: ["style"],
    div: ["style"],
    h1: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    h5: ["style"],
    h6: ["style"],
    span: ["style"],
    mark: ["style", "data-color"],
    th: ["colspan", "rowspan", "colwidth", "style"],
    td: ["colspan", "rowspan", "colwidth", "style"],
  },
  allowedClasses: {
    a: ["text-primary", "underline", "underline-offset-2"],
    ol: ["list-decimal"],
    ul: ["list-disc"],
  },
  allowedStyles: {
    "*": {
      "text-align": [/^(?:left|center|right|justify)$/],
      color: [SAFE_COLOR],
      "background-color": [SAFE_COLOR],
    },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    a: ["http", "https", "mailto", "tel"],
    img: ["http", "https"],
  },
  allowProtocolRelative: false,
  nonTextTags: ["style", "script", "textarea", "option", "xmp", "noscript"],
}

export function sanitizeHtml(input: string): string {
  if (!input) return ""
  return cleanHtml(input, RICH_TEXT_OPTIONS).replace(
    /<(br|hr|img)([^>]*) \/>/gi,
    "<$1$2>"
  )
}
