"use client"

import Link from "next/link"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import PlusIcon from "lucide-react/dist/esm/icons/plus"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  marketplaceCostLabel,
  marketplaceFunctionLabel,
  marketplaceStageLabel,
  marketplaceTypeLabel,
} from "../../lib/marketplace-directory"
import type { MarketplaceResource } from "../../marketplace-types"

export function MarketplaceResourceCard({
  resource,
  selected,
  onToggle,
}: {
  resource: MarketplaceResource
  selected: boolean
  onToggle: (id: string) => void
}) {
  return (
    <Card
      className="rounded-none shadow-none first:rounded-t-xl last:rounded-b-xl sm:rounded-xl"
      data-marketplace-resource={resource.id}
    >
      <CardHeader className="gap-3 px-5 pt-5 pb-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{marketplaceTypeLabel(resource.type)}</Badge>
          <Badge variant="secondary">
            {marketplaceCostLabel(resource.costModel)}
          </Badge>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-[0.08em] uppercase">
            {resource.provider}
          </p>
          <CardTitle className="mt-1 text-xl leading-7 tracking-[-0.02em]">
            <h3>{resource.name}</h3>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 px-5 pb-5 sm:px-6">
        <p className="text-muted-foreground text-sm leading-6">
          {resource.description}
        </p>
        <div className="border-l-2 pl-4">
          <p className="text-xs font-semibold tracking-[0.08em] uppercase">
            Use when
          </p>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {resource.useWhen}
          </p>
        </div>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs">Access</dt>
            <dd className="mt-1 leading-5">{resource.costNote}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Eligibility</dt>
            <dd className="mt-1 leading-5">{resource.eligibility}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Geography</dt>
            <dd className="mt-1 leading-5">{resource.geography}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Delivery</dt>
            <dd className="mt-1 leading-5">{resource.delivery}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-1.5" aria-label="Relevant functions">
          {resource.functions.map((value) => (
            <span
              key={value}
              className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs"
            >
              {marketplaceFunctionLabel(value)}
            </span>
          ))}
        </div>
        <details className="group border-t pt-4">
          <summary className="focus-visible:ring-ring flex min-h-11 cursor-pointer list-none items-center text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none">
            Review fit and source
          </summary>
          <dl className="mt-3 grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Stages</dt>
              <dd className="mt-1">
                {resource.stages.map(marketplaceStageLabel).join(", ")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Account</dt>
              <dd className="mt-1 leading-5">{resource.accountRequirement}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Language</dt>
              <dd className="mt-1 leading-5">{resource.languages}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Accessibility</dt>
              <dd className="mt-1 leading-5">{resource.accessibility}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Why included</dt>
              <dd className="mt-1 leading-5">{resource.whyIncluded}</dd>
            </div>
          </dl>
          <p className="text-muted-foreground mt-4 text-xs leading-5">
            Source reviewed{" "}
            <time dateTime={resource.reviewedDate}>
              {resource.reviewedDate}
            </time>
            . Recheck by{" "}
            <time dateTime={resource.reviewByDate}>
              {resource.reviewByDate}
            </time>
            .
          </p>
        </details>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t px-5 pt-4 pb-5 sm:px-6">
        <Button
          asChild
          variant="outline"
          className="min-h-11 flex-1 sm:flex-none"
        >
          <a href={resource.url} target="_blank" rel="noreferrer">
            Open official page
            <ArrowUpRightIcon data-icon="inline-end" aria-hidden />
          </a>
        </Button>
        <Button
          type="button"
          variant={selected ? "secondary" : "default"}
          className="min-h-11 flex-1 sm:flex-none"
          aria-pressed={selected}
          onClick={() => onToggle(resource.id)}
        >
          {selected ? (
            <CheckIcon data-icon="inline-start" aria-hidden />
          ) : (
            <PlusIcon data-icon="inline-start" aria-hidden />
          )}
          {selected ? "Shortlisted" : "Add to shortlist"}
        </Button>
        {resource.relatedGuide ? (
          <Button asChild variant="link" className="min-h-11 px-1">
            <Link href={resource.relatedGuide.href}>
              Read {resource.relatedGuide.title}
            </Link>
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}
