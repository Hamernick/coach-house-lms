// Minimal markdown-to-HTML for admin wizard previews
export function markdownToHtmlLite(markdown: string | null | undefined): string {
  if (!markdown) return ""

  const paragraphs = markdown
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return markdown.replace(/\n/g, "<br />")
  }

  return paragraphs
    .map((paragraph) => {
      const normalized = paragraph
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
      return `<p>${normalized.replace(/\n/g, "<br />")}</p>`
    })
    .join("")
}

