"use server"

import { resolveOptionalAuthenticatedAppContext } from "@/lib/auth/request-context"

import type { PageHealthEventInput } from "../types"
import { recordPageHealthEvent } from "./record"

async function resolvePageHealthActor() {
  try {
    const context = await resolveOptionalAuthenticatedAppContext()
    return {
      orgId: context?.activeOrg.orgId ?? null,
      userId: context?.user.id ?? null,
    }
  } catch {
    return {
      orgId: null,
      userId: null,
    }
  }
}

export async function recordPageHealthEventAction(input: PageHealthEventInput) {
  const actor = await resolvePageHealthActor()
  return recordPageHealthEvent({
    input,
    orgId: actor.orgId,
    userId: actor.userId,
  })
}
