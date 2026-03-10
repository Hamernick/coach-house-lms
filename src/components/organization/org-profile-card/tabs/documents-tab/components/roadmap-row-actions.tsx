"use client"

import Link from "next/link"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import Route from "lucide-react/dist/esm/icons/route"

import { Button } from "@/components/ui/button"
import type { RoadmapRow } from "../types"

type RoadmapRowActionsProps = {
  row: RoadmapRow
  publicSlug?: string | null
}

export function RoadmapRowActions({ row, publicSlug }: RoadmapRowActionsProps) {
  return (
    <div className="flex min-w-[180px] items-center justify-end gap-2">
      <Button type="button" size="sm" variant="secondary" asChild>
        <Link href={`/roadmap/${row.section.slug}`}>
          <Route className="h-4 w-4" aria-hidden />
          Open
        </Link>
      </Button>
      {publicSlug && row.visibility === "public" ? (
        <Button type="button" size="sm" variant="ghost" asChild>
          <Link href={`/${publicSlug}/roadmap#${row.section.slug}`} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" aria-hidden />
            Public
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
