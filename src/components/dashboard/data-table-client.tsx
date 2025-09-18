"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

import { TableSkeleton } from "@/components/dashboard/skeletons"
import type { DashboardTableRow } from "@/lib/dashboard/table-data"

const DataTable = dynamic(
  () => import("@/components/data-table").then((mod) => ({ default: mod.DataTable })),
  {
    ssr: false,
    loading: () => <TableSkeleton />,
  }
)

export function DynamicDataTable() {
  const [rows, setRows] = useState<DashboardTableRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const params = new URLSearchParams({ pageSize: "50" })
        const response = await fetch(`/api/dashboard/table?${params.toString()}`)
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }
        const payload = (await response.json()) as { items?: DashboardTableRow[] }
        if (!cancelled) {
          setRows(Array.isArray(payload.items) ? payload.items : [])
        }
      } catch (cause) {
        console.error("Failed to load dashboard table data", cause)
        if (!cancelled) {
          setError("We hit a snag loading the data table.")
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-6 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (!rows) {
    return <TableSkeleton />
  }

  return <DataTable data={rows} />
}
