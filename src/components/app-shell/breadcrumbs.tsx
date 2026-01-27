import { Fragment } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export type BreadcrumbSegment = {
  label: string
  href?: string
}

export function AppBreadcrumbs({ segments }: { segments: BreadcrumbSegment[] }) {
  if (segments.length === 0) {
    return null
  }

  return (
    <Breadcrumb aria-label="Breadcrumb">
      <BreadcrumbList className="flex min-w-0 flex-nowrap items-center gap-1.5 text-sm text-muted-foreground overflow-hidden sm:flex-wrap sm:gap-2.5 sm:overflow-visible sm:break-words">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          return (
            <Fragment key={`seg-${index}`}>
              <BreadcrumbItem key={`item-${index}`} className="min-w-0">
                {segment.href && !isLast ? (
                  <BreadcrumbLink href={segment.href} className="truncate sm:overflow-visible sm:whitespace-normal sm:text-clip">
                    {segment.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate sm:overflow-visible sm:whitespace-normal sm:text-clip">
                    {segment.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {isLast ? null : <BreadcrumbSeparator key={`sep-${index}`} />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
