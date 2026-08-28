"use server"

import { validateGoogleAccountLink as validateGoogleAccountLinkImpl } from "./server/google-account-linking"

export async function validateGoogleAccountLink(input: unknown) {
  return validateGoogleAccountLinkImpl(input)
}
