"use server"

import { normalizeWorkspaceMapCardInput } from "../lib"
import type { WorkspaceMapCardInput } from "../types"

export async function saveWorkspaceMapCard(input: WorkspaceMapCardInput) {
  const normalized = normalizeWorkspaceMapCardInput(input)
  // Persist with DB layer here.
  return normalized
}
