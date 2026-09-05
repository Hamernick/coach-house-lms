export type DocumentationSearchSection = {
  id?: string
  title: string
  text: string
}

export type DocumentationSearchDocument = {
  href: string
  title: string
  category: string
  description: string
  sections: DocumentationSearchSection[]
}

export type DocumentationSearchResult = {
  href: string
  title: string
  category: string
  sectionTitle: string | null
  excerpt: string
}
