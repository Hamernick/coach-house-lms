export type WorkspaceSupportParticipant = {
  session_id: string
  actor_id: string
  name: string
  role: string
  path: string
  position: { x: number; y: number } | null
  editing: boolean
}
export type WorkspaceSupportPresenceInput = {
  organizationId: string
  sessionId: string
  path: string
  position: { x: number; y: number } | null
  editing: boolean
}
