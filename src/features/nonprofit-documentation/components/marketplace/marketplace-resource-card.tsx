"use client"

import Link from "next/link"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import BookmarkIcon from "lucide-react/dist/esm/icons/bookmark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  marketplaceCostLabel,
  marketplaceTypeLabel,
} from "../../lib/marketplace-directory"
import type { MarketplaceResource } from "../../marketplace-types"

export function MarketplaceResourceCard({
  resource,
  selected,
  disabled,
  onToggle,
}: {
  resource: MarketplaceResource
  selected: boolean
  disabled: boolean
  onToggle: (id: string) => void
}) {
  return (
    <Card
      className="gap-0 rounded-3xl py-0 shadow-none"
      data-marketplace-resource={resource.id}
    >
      <CardHeader className="gap-4 p-5 pb-0 sm:p-6 sm:pb-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs">
            {marketplaceTypeLabel(resource.type)}
          </span>
          <Badge variant="secondary" className="rounded-full font-normal">
            {marketplaceCostLabel(resource.costModel)}
          </Badge>
        </div>
        <h3 className="text-lg leading-6 font-semibold tracking-tight">
          <Link
            href={`/documentation/marketplace/${resource.id}`}
            className="underline-offset-4 hover:underline"
          >
            {resource.name}
          </Link>
        </h3>
      </CardHeader>
      <CardContent className="flex-1 p-5 pt-3 sm:p-6 sm:pt-3">
        <p className="text-muted-foreground text-sm leading-6">
          {resource.description}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-2 px-5 pb-5 sm:px-6 sm:pb-6">
        <Button asChild variant="ghost" className="min-h-11 rounded-full px-3">
          <Link href={`/documentation/marketplace/${resource.id}`}>
            View resource
            <ArrowRightIcon aria-hidden />
          </Link>
        </Button>
        <Button
          type="button"
          variant={selected ? "secondary" : "outline"}
          className="min-h-11 rounded-full"
          disabled={disabled}
          aria-pressed={selected}
          aria-label={`${selected ? "Remove" : "Save"} ${resource.name}${selected ? " from saved resources" : ""}`}
          onClick={() => onToggle(resource.id)}
        >
          <BookmarkIcon
            className={selected ? "fill-current" : undefined}
            aria-hidden
          />
          {selected ? "Saved" : "Save"}
        </Button>
      </CardFooter>
    </Card>
  )
}
