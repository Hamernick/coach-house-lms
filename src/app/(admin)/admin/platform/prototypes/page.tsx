import {
  buildPrototypeLabInput,
  PrototypeLabPanel,
} from "@/features/prototype-lab"
import { requireAdmin } from "@/lib/admin/auth"

function readSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : null
}

export default async function AdminPlatformPrototypesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const input = buildPrototypeLabInput({
    selectedEntryId: readSearchParam(resolvedSearchParams?.entry),
    selectedProjectId: readSearchParam(resolvedSearchParams?.project),
  })

  return <PrototypeLabPanel input={input} />
}
