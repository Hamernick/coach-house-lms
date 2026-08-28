"use server"

import { preprovisionGoogleSignup as provisionGoogleSignup } from "@/lib/google-auth-provisioning"

export async function preprovisionGoogleSignup(input: unknown) {
  return provisionGoogleSignup(input)
}
