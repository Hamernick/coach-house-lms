// Parse option lists from user input
// mode 'auto': split by newline if present, else by comma
export function parseOptions(input: string, mode: 'auto' | 'comma' | 'newline' = 'auto'): string[] {
  const s = String(input ?? '')
  let parts: string[]
  if (mode === 'newline' || (mode === 'auto' && /\n/.test(s))) {
    parts = s.split(/\r?\n/)
  } else {
    parts = s.split(',')
  }
  return parts.map((x) => x.trim()).filter(Boolean)
}

