"use server"

import { normalizeWorkspaceOntologyState } from "../lib"

export async function normalizeWorkspaceOntologyStateAction(value: unknown) {
  return normalizeWorkspaceOntologyState(value)
}
