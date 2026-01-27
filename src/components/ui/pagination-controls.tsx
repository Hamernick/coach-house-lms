import Link from "next/link"

import { Button } from "@/components/ui/button"

export function PaginationControls({
  page,
  pageSize,
  total,
  basePath = "/classes",
}: {
  page: number
  pageSize: number
  total: number
  basePath?: string
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const prevPage = page > 1 ? page - 1 : null
  const nextPage = page < totalPages ? page + 1 : null

  return (
    <div className="flex items-center justify-between border-t px-4 py-4 text-sm text-muted-foreground lg:px-6">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" disabled={!prevPage}>
          <Link href={`${basePath}?page=${prevPage ?? page}`}>Previous</Link>
        </Button>
        <Button asChild variant="outline" size="sm" disabled={!nextPage}>
          <Link href={`${basePath}?page=${nextPage ?? page}`}>Next</Link>
        </Button>
      </div>
    </div>
  )
}
