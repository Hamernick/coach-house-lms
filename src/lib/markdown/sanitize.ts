import cleanHtml from "sanitize-html"
import { normalizeTextColorStyles, THEME_COLOR_PATTERN } from "./theme-colors"

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

const SAFE_TEXT_ALIGNMENT = /^(?:left|center|right|justify)$/

const RICH_TEXT_OPTIONS: cleanHtml.IOptions = {
  transformTags: {
    span: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        ...(attribs.style
          ? { style: normalizeTextColorStyles(attribs.style) }
          : {}),
      },
    }),
  },
  allowedTags: RICH_TEXT_TAGS,
  allowedAttributes: {
    a: ["href", "target", "rel", "class"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    ol: ["start", "type", "class"],
    ul: ["class"],
    span: ["style"],
    p: ["style"],
    div: ["style"],
    h1: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    h5: ["style"],
    h6: ["style"],
    th: ["colspan", "rowspan", "colwidth", "style"],
    td: ["colspan", "rowspan", "colwidth", "style"],
  },
  allowedClasses: {
    a: ["text-primary", "underline", "underline-offset-2"],
    ol: ["list-decimal"],
    ul: ["list-disc"],
  },
  allowedStyles: {
    span: {
      color: [/^inherit$/, THEME_COLOR_PATTERN],
      "background-color": [/^transparent$/, THEME_COLOR_PATTERN],
      "font-size": [
        /^(?:[1-9]\d?(?:\.\d+)?)(?:px|pt)$|^(?:[0-4](?:\.\d+)?)(?:em|rem)$/,
      ],
      "font-family": [/^[a-zA-Z0-9 ,"'-]{1,160}$/],
    },
    p: { "text-align": [SAFE_TEXT_ALIGNMENT] },
    div: { "text-align": [SAFE_TEXT_ALIGNMENT] },
    h1: { "text-align": [SAFE_TEXT_ALIGNMENT] },
    h2: { "text-align": [SAFE_TEXT_ALIGNMENT] },
    h3: { "text-align": [SAFE_TEXT_ALIGNMENT] },
    h4: { "text-align": [SAFE_TEXT_ALIGNMENT] },
    h5: { "text-align": [SAFE_TEXT_ALIGNMENT] },
    h6: { "text-align": [SAFE_TEXT_ALIGNMENT] },
    th: { "text-align": [SAFE_TEXT_ALIGNMENT] },
    td: { "text-align": [SAFE_TEXT_ALIGNMENT] },
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
