// HTML -> Markdown (very lightweight) and HTML stripping helpers used on server actions

export function decodeHtmlEntities(value: string) {
  const str = String(value)
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

export function htmlToMarkdown(html: string) {
  if (typeof html !== 'string' || html.trim().length === 0) {
    return ''
  }
  let output = html
    .replace(/<h1[^>]*>/gi, '# ')
    .replace(/<h2[^>]*>/gi, '## ')
    .replace(/<h3[^>]*>/gi, '### ')
    .replace(/<h4[^>]*>/gi, '#### ')
    .replace(/<h5[^>]*>/gi, '##### ')
    .replace(/<h6[^>]*>/gi, '###### ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<strong[^>]*>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<em[^>]*>/gi, '*')
    .replace(/<\/em>/gi, '*')
  output = output.replace(/<[^>]+>/g, '')
  output = decodeHtmlEntities(output)
  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function stripHtml(html: string) {
  if (typeof html !== 'string') {
    return ''
  }
  const output = html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
  return decodeHtmlEntities(output).replace(/\n{3,}/g, '\n\n').trim()
}

