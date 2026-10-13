"use client"

import { ResourceDirectoryPaginationProvider, type ResourceDirectoryPagination } from "@/features/find-resource-index/client"

import type { ReactNode } from "react"

export function PublicMapIndexChrome({
  mapSurface,
  pagination = null,
}: {
  mapSurface: ReactNode
  pagination?: ResourceDirectoryPagination | null
}) {
  return <ResourceDirectoryPaginationProvider value={pagination}>{mapSurface}</ResourceDirectoryPaginationProvider>
}
