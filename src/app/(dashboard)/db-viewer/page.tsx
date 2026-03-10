import {
  InternalDbViewerPanel,
  loadInternalDbViewerSnapshot,
} from "@/features/internal-db-viewer"

type DbViewerPageSearchParams = {
  table?: string | string[]
  limit?: string | string[]
}

export default async function DbViewerPage({
  searchParams,
}: {
  searchParams?: Promise<DbViewerPageSearchParams>
}) {
  const resolved = searchParams ? await searchParams : undefined
  const snapshot = await loadInternalDbViewerSnapshot({
    tableParam: resolved?.table,
    limitParam: resolved?.limit,
  })

  return <InternalDbViewerPanel snapshot={snapshot} />
}
