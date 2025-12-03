"use server"

import { revalidatePath } from "next/cache"

import { SHARED_REVALIDATE_TARGETS } from "./utils"

export async function revalidateClassViews({
  classId,
  classSlug,
  additionalTargets = [],
}: {
  classId?: string | null
  classSlug?: string | null
  additionalTargets?: Array<Parameters<typeof revalidatePath>[0]>
} = {}) {
  for (const args of SHARED_REVALIDATE_TARGETS) {
    revalidatePath(...args)
  }
  if (classId) {
    revalidatePath(`/admin/classes/${classId}`)
  }
  for (const target of additionalTargets) {
    revalidatePath(target)
  }
  if (classSlug) {
    revalidatePath(`/class/${classSlug}`)
  }
}
