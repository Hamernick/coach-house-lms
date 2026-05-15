export type UserJourneyAtlasMetric = {
  label: string
  value: string
  detail: string
}

export type UserJourneyAtlasSurfaceKind =
  | "ai"
  | "access"
  | "admin"
  | "auth"
  | "coaching"
  | "data"
  | "email"
  | "form"
  | "outcome"
  | "payment"
  | "route"
  | "system"
  | "telemetry"
  | "workspace"

export type UserJourneyAtlasHealthStatus =
  | "activation-gap"
  | "admin-reference"
  | "ai-stub"
  | "integration-gap"
  | "live"
  | "recovery-gap"
  | "telemetry-gap"

export type UserJourneyAtlasLane = {
  id: string
  label: string
  x: number
  width: number
}

export type UserJourneyAtlasNode = {
  categoryLabel: string
  dataFields: string[]
  fileKindLabel: string
  healthStatus: UserJourneyAtlasHealthStatus
  healthStatusLabel: string
  healthSummary: string
  journeyStep: number
  id: string
  laneId: string
  nextStepLabels: string[]
  surfaceKind: UserJourneyAtlasSurfaceKind
  surfaceKindLabel: string
  systemEvents: string[]
  title: string
  route: string
  file: string
  description: string
  x: number
  y: number
  width: number
  height: number
}

export type UserJourneyAtlasEdge = {
  id: string
  from: string
  to: string
  label: string
}

export type UserJourneyAtlasCanvas = {
  width: number
  height: number
}

export type UserJourneyAtlasInput = {
  id: string
  title: string
  subtitle: string
  updatedLabel: string
  mermaidPath: string
  mermaidSource: string
  metrics: UserJourneyAtlasMetric[]
  lanes: UserJourneyAtlasLane[]
  nodes: UserJourneyAtlasNode[]
  edges: UserJourneyAtlasEdge[]
  canvas: UserJourneyAtlasCanvas
}
