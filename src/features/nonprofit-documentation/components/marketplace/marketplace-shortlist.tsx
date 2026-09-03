"use client"

import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ListChecksIcon from "lucide-react/dist/esm/icons/list-checks"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"

import type { MarketplaceResource } from "../../marketplace-types"

export function MarketplaceShortlist({
  resources,
  ready,
  onClear,
  onDownload,
}: {
  resources: MarketplaceResource[]
  ready: boolean
  onClear: () => void
  onDownload: () => void
}) {
  return (
    <aside
      id="marketplace-shortlist"
      className="bg-muted/30 border p-5 sm:p-6"
      aria-labelledby="marketplace-shortlist-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ListChecksIcon className="size-4" aria-hidden />
            <h2 id="marketplace-shortlist-title" className="font-semibold">
              Working shortlist
            </h2>
            <Badge variant="outline" data-marketplace-shortlist-count>
              {ready ? resources.length : 0}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
            This device-local list is a comparison aid, not a recommendation.
            Confirm fit, terms, privacy, security, accessibility, integrations,
            total cost, and authority before deciding.
          </p>
        </div>
        {resources.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-9"
              onClick={onDownload}
            >
              <DownloadIcon data-icon="inline-start" aria-hidden />
              Download CSV
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 sm:min-h-9"
              onClick={onClear}
            >
              <Trash2Icon data-icon="inline-start" aria-hidden />
              Clear
            </Button>
          </div>
        ) : null}
      </div>
      {resources.length > 0 ? (
        <ol className="mt-5 grid border-t sm:grid-cols-2">
          {resources.map((resource, index) => (
            <li
              key={resource.id}
              className="border-b py-3 text-sm sm:odd:border-r sm:odd:pr-4 sm:even:pl-4"
            >
              <span className="text-muted-foreground mr-2 font-mono text-xs">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-medium">{resource.name}</span>
              <span className="text-muted-foreground">
                {" "}
                — {resource.provider}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <Empty
          variant="subtle"
          size="sm"
          className="mt-5"
          title={ready ? "No resources shortlisted" : "Loading shortlist"}
          description={
            ready
              ? "Add a resource below to create a device-local comparison list."
              : "Checking this browser for a saved list."
          }
        />
      )}
    </aside>
  )
}
