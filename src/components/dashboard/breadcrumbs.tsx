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

export function DashboardBreadcrumbs({ segments }: { segments: BreadcrumbSegment[] }) {
  if (segments.length === 0) {
    return null
  }

  return (
    <Breadcrumb aria-label="Breadcrumb">
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1

          return (
            <BreadcrumbItem key={`${segment.label}-${index}`}>
              {segment.href && !isLast ? (
                <BreadcrumbLink href={segment.href}>{segment.label}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              )}
              {isLast ? null : <BreadcrumbSeparator />}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
