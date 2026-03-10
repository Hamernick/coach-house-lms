import Link from "next/link"
import DatabaseIcon from "lucide-react/dist/esm/icons/database"
import LockIcon from "lucide-react/dist/esm/icons/lock"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  collectInternalDbViewerColumns,
  formatInternalDbViewerCellValue,
  INTERNAL_DB_VIEWER_ALLOWED_LIMITS,
} from "../lib"
import type { InternalDbViewerSnapshot, InternalDbViewerTableName } from "../types"

type InternalDbViewerPanelProps = {
  snapshot: InternalDbViewerSnapshot
}

function buildViewerHref({
  table,
  rowLimit,
}: {
  table: InternalDbViewerTableName
  rowLimit: number
}) {
  return `/db-viewer?table=${encodeURIComponent(table)}&limit=${rowLimit}`
}

function formatRenderedCount(snapshot: InternalDbViewerSnapshot): string {
  if (snapshot.rowCount === null) {
    return `${snapshot.rows.length} row${snapshot.rows.length === 1 ? "" : "s"}`
  }
  return `${snapshot.rows.length} of ${snapshot.rowCount} rows`
}

export function InternalDbViewerPanel({ snapshot }: InternalDbViewerPanelProps) {
  const columns = collectInternalDbViewerColumns(snapshot.rows)

  return (
    <div className="space-y-4 px-4 py-4 md:px-6 md:py-6">
      <Card className="border-border/70">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-md text-[10px]">
              Internal
            </Badge>
            <Badge variant="secondary" className="rounded-md text-[10px] capitalize">
              {snapshot.access.mode}
            </Badge>
          </div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DatabaseIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
            Read-only DB viewer
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Hidden route for authorized team members. Access is server-checked by login session + admin/allowlist.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <LockIcon className="h-3.5 w-3.5" aria-hidden />
            <span>{snapshot.access.email ?? "No email in profile session"}</span>
            <span>•</span>
            <span>{formatRenderedCount(snapshot)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tables</p>
            <div className="flex flex-wrap gap-2">
              {snapshot.allowedTables.map((tableName) => {
                const selected = tableName === snapshot.selectedTable
                return (
                  <Button
                    key={tableName}
                    asChild
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    className={cn("h-8 rounded-md text-xs", !selected && "border-border/70")}
                  >
                    <Link href={buildViewerHref({ table: tableName, rowLimit: snapshot.rowLimit })}>{tableName}</Link>
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rows</p>
            <div className="flex flex-wrap gap-2">
              {INTERNAL_DB_VIEWER_ALLOWED_LIMITS.map((limit) => {
                const selected = limit === snapshot.rowLimit
                return (
                  <Button
                    key={limit}
                    asChild
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    className={cn("h-8 rounded-md text-xs", !selected && "border-border/70")}
                  >
                    <Link href={buildViewerHref({ table: snapshot.selectedTable, rowLimit: limit })}>{limit}</Link>
                  </Button>
                )
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.error ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to load table data</AlertTitle>
              <AlertDescription>{snapshot.error}</AlertDescription>
            </Alert>
          ) : null}

          {!snapshot.error && snapshot.rows.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-5 text-sm text-muted-foreground">
              No rows returned for `{snapshot.selectedTable}`.
            </div>
          ) : null}

          {!snapshot.error && snapshot.rows.length > 0 ? (
            <div className="max-h-[65vh] overflow-auto rounded-xl border border-border/70">
              <Table className="min-w-[920px]">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column} className="text-xs font-semibold text-foreground">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.rows.map((row, rowIndex) => (
                    <TableRow key={`${snapshot.selectedTable}:${rowIndex}`}>
                      {columns.map((column) => (
                        <TableCell key={`${rowIndex}:${column}`} className="max-w-[360px] py-2 align-top">
                          <span className="block whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground">
                            {formatInternalDbViewerCellValue(row[column])}
                          </span>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
