"use server"

import type { SignupLegalConsent } from "@/features/legal-consent"

type CreateTesterAccountInput = {
  email: string
  password: string
  legalConsent: SignupLegalConsent
}

type CreateTesterAccountResult =
  | { ok: true; created: boolean; userId: string }
  | { ok: false; error: string }

export async function createTesterAccountAction(
  _input: CreateTesterAccountInput
): Promise<CreateTesterAccountResult> {
  return {
    ok: false,
    error: "Tester account provisioning is unavailable. Contact support.",
  }
}
