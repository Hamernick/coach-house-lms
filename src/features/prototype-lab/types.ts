export type PrototypeLabEntryKind = "email" | "flow"

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
