export function documentationCsvCell(
  value: string | number | boolean | null | undefined
) {
  let text = value == null ? "" : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}
