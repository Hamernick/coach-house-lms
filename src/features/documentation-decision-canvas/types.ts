export type DocumentationDecisionStep = {
  id: string
  label: string
  description?: string
  dependsOn?: string[]
}

export type DocumentationDecisionGraph = {
  steps: Array<
    DocumentationDecisionStep & {
      position: { x: number; y: number }
      incoming: boolean
      outgoing: boolean
    }
  >
  edges: Array<{ id: string; source: string; target: string }>
}
