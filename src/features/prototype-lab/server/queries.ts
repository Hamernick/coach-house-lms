import { requireAdmin } from "@/lib/admin/auth"
import { buildPrototypeLabInput } from "../lib"
import type { PrototypeLabInput } from "../types"

type PrototypeLabSearchParams = Record<string, string | string[] | undefined> | undefined

function readSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : null
}

export async function getPrototypeLabPageInput(
  searchParams: PrototypeLabSearchParams,
): Promise<PrototypeLabInput> {
  await requireAdmin()

  return buildPrototypeLabInput({
    selectedEntryId: readSearchParam(searchParams?.entry),
    selectedProjectId: readSearchParam(searchParams?.project),
  })
}
