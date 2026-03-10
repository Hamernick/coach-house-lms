"use server"

import type { OrgProfile } from "@/lib/organization/org-profile-brand-types"

import { resolveBrandManifest } from "../lib"

export async function saveWorkspaceBrandKit(input: OrgProfile) {
  return resolveBrandManifest(input)
}
