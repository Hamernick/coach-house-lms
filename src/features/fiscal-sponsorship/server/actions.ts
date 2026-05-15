"use server"

import { normalizeFiscalSponsorshipInput } from "../lib"
import type { FiscalSponsorshipInput } from "../types"

export async function saveFiscalSponsorship(input: FiscalSponsorshipInput) {
  const normalized = normalizeFiscalSponsorshipInput(input)
  // Persist with DB layer here.
  return normalized
}
