export type Module = {
  id: string
  title: string
  subtitle?: string
}

export type ClassDef = {
  id: string
  title: string
  blurb: string
  slug?: string
  modules: Module[]
}
