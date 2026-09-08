export type ImportedDocument = {
  name: string
  html: string
  warnings: string[]
  sourceUrl?: string
}
export type DocumentImportMode = "append" | "replace"
