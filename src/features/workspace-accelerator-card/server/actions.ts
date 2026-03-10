"use server"

import { normalizeWorkspaceAcceleratorCardInput } from "../lib"
import type { WorkspaceAcceleratorCardInput } from "../types"

export async function saveWorkspaceAcceleratorCard(input: WorkspaceAcceleratorCardInput) {
  const normalized = normalizeWorkspaceAcceleratorCardInput(input)
  // Persist with DB layer here.
  return normalized
}
