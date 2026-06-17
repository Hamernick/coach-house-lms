export type PrototypeLabEntryKind = "email" | "flow" | "ops"

export type PrototypeLabEntry = {
  id: string
  projectId: string
  folderLabel: string
  title: string
  description: string
  kind: PrototypeLabEntryKind
  statusLabel: string
}

export type PrototypeLabInput = {
  selectedEntry: PrototypeLabEntry
}
