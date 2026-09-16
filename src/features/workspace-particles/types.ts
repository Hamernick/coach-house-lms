import type { RoadmapSection } from "@/lib/roadmap/types"

export type ParticleKind = "roadmap" | "drive" | "image"
export type ParticleSize = "icon" | "mini" | "large"
export type ParticleReference = { kind: ParticleKind; id: string }
export type ParticlePlacement = {
  id: string
  source: ParticleReference
  x: number
  y: number
  size: ParticleSize
}
export type ParticleImage = { id: string; title: string; path: string }
export type ParticleConnection = { id: string; source: string; target: string }
export type WorkspaceParticleState = {
  version: 1
  items: ParticlePlacement[]
  images: ParticleImage[]
  connections: ParticleConnection[]
  updatedAt: string
}
export type ParticleDriveDocument = {
  id: string
  fileId: string
  name: string
  mimeType: string
  status: "available" | "trashed" | "inaccessible" | "needs_reconnect"
}
export type ParticleSource = {
  ref: ParticleReference
  title: string
  description: string
  available: boolean
  section?: RoadmapSection
  document?: ParticleDriveDocument
  image?: ParticleImage
}
