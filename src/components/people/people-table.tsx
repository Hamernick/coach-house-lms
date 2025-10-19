"use client"

import * as React from "react"
import { memo, useDeferredValue, useMemo, useRef, useState, useTransition } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
  type SortingState,
} from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import type { OrgPerson } from "@/app/(dashboard)/people/actions"
import { deletePersonAction, refreshPersonLinkedInImageAction, upsertPersonAction } from "@/app/(dashboard)/people/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IconDotsVertical, IconExternalLink } from "@tabler/icons-react"
import { CreatePersonDialog } from "@/components/people/create-person-dialog"
import { ManagerSelect } from "@/components/people/manager-select"

export type PersonRow = OrgPerson & { displayImage?: string | null }

const CATEGORY_LABEL: Record<OrgPerson["category"], string> = {
  staff: "Staff",
  board: "Board",
  supporter: "Supporter",
}

const CATEGORY_BADGE: Record<OrgPerson["category"], string> = {
  staff: "bg-sky-500/15 text-sky-700 dark:text-sky-200 border-sky-500/30",
  board: "bg-violet-500/15 text-violet-700 dark:text-violet-200 border-violet-500/30",
  supporter: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-500/30",
}

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

function PeopleTableComponent({
  people,
}: {
  people: PersonRow[]
}) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<OrgPerson["category"] | "all">("all")
  const [selection, setSelection] = useState<Record<string, boolean>>({})
  const [editing, setEditing] = useState<PersonRow | null>(null)
  const [pending, startTransition] = useTransition()

  const deferredFilter = useDeferredValue(globalFilter)
  const filtered = useMemo(() => {
    let out = people
    if (categoryFilter !== "all") out = out.filter((p) => p.category === categoryFilter)
    const q = deferredFilter.trim().toLowerCase()
    if (q) out = out.filter((p) => `${p.name} ${p.title ?? ""}`.toLowerCase().includes(q))
    return out
  }, [people, categoryFilter, deferredFilter])

  const columns: ColumnDef<PersonRow>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 36,
      },
      {
        accessorKey: "name",
        header: "Person",
        cell: ({ row }) => {
          const p = row.original
          return (
            <button
              className="group flex w-full items-center gap-3 text-left"
              onClick={() => setEditing(p)}
            >
              <Avatar className="size-8">
                <AvatarImage src={p.displayImage ?? p.image ?? undefined} alt={p.name} />
                <AvatarFallback>{initials(p.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground group-hover:underline">
                  {p.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {p.title}
                </span>
              </span>
            </button>
          )
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const cat = row.original.category
          return (
            <Badge variant="outline" className={`px-1.5 ${CATEGORY_BADGE[cat]}`}>{CATEGORY_LABEL[cat]}</Badge>
          )
        },
      },
      {
        id: "manager",
        header: "Reports To",
        cell: ({ row }) => {
          const p = row.original
          // Only staff can have a manager
          if (p.category !== "staff") {
            return <span className="text-muted-foreground">—</span>
          }
          // Options sourced from the current table view (people visible in the table), restricted to staff
          const options = filtered.filter((x) => x.id !== p.id && x.category === "staff")
          return (
            <ManagerSelect
              value={p.reportsToId ?? null}
              options={options}
              onChange={(val) => {
                startTransition(async () => {
                  const toastId = toast.loading("Updating manager…")
                  const res = await upsertPersonAction({
                    id: p.id,
                    name: p.name,
                    title: p.title ?? null,
                    email: p.email ?? null,
                    linkedin: p.linkedin ?? null,
                    category: p.category,
                    image: p.image ?? null,
                    reportsToId: val,
                  })
                  if ((res as any)?.error) {
                    toast.error((res as any).error, { id: toastId })
                  } else {
                    toast.success("Updated", { id: toastId })
                    router.refresh()
                  }
                })
              }}
            />
          )
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => {
          const email = row.original.email
          return email ? (
            <a href={`mailto:${email}`} className="text-foreground underline-offset-4 hover:underline">
              {email}
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
      },
      {
        id: "linkedin",
        header: "LinkedIn",
        cell: ({ row }) => {
          const url = row.original.linkedin
          if (!url) return <span className="text-muted-foreground">—</span>
          const href = url.startsWith("http") ? url : `https://www.linkedin.com/in/${url.replace(/^\//, "")}`
          try {
            const u = new URL(href)
            return (
              <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline">
                {u.hostname.replace(/^www\./, "")}
                <IconExternalLink className="size-3" />
              </a>
            )
          } catch {
            return (
              <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline">
                LinkedIn <IconExternalLink className="size-3" />
              </a>
            )
          }
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const p = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <IconDotsVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setEditing(p)}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={async()=>{
                  const t = toast.loading("Refreshing photo…")
                  const r = await refreshPersonLinkedInImageAction(p.id)
                  if ((r as any)?.error) toast.error((r as any).error, { id: t })
                  else { toast.success("Photo updated", { id: t }); router.refresh() }
                }}>Refresh LinkedIn Photo</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={async()=>{
                  const t = toast.loading("Deleting…")
                  const r = await deletePersonAction(p.id)
                  if ((r as any)?.error) toast.error((r as any).error, { id: t })
                  else { toast.success("Deleted", { id: t }); router.refresh() }
                }}>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    // Recompute when filtered list changes to keep dropdown options in sync with the table view
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered]
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection: selection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
  })

  const parentRef = useRef<HTMLDivElement>(null)
  const rows = table.getRowModel().rows
  const enableVirtual = rows.length > 200
  const virtualizer = useVirtualizer({
    count: enableVirtual ? rows.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 8,
  })
  const virtualRows = enableVirtual ? virtualizer.getVirtualItems() : []
  const totalSize = enableVirtual ? virtualizer.getTotalSize() : 0
  const paddingTop = enableVirtual && virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom = enableVirtual && virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex items-center gap-2">
          <Label htmlFor="people-search" className="sr-only">Search</Label>
          <Input
            id="people-search"
            placeholder="Search people…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-8 w-[240px]"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <CreatePersonDialog triggerClassName="h-8" people={people} />
          <Select value={categoryFilter} onValueChange={(v)=> setCategoryFilter(v as any)}>
            <SelectTrigger size="sm" className="w-36">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="board">Board</SelectItem>
              <SelectItem value="supporter">Supporters</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table (virtualized rows) */}
      <div className="rounded-md border">
        <div ref={parentRef} className="max-h-[60vh] overflow-auto will-change-auto">
        <Table>
          <TableHeader className="bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      No people found.
                    </TableCell>
                  </TableRow>
                ) : enableVirtual ? (
                  <>
                    {paddingTop > 0 ? (
                      <TableRow aria-hidden>
                        <TableCell colSpan={columns.length} className="p-0" style={{ height: paddingTop }} />
                      </TableRow>
                    ) : null}
                    {virtualRows.map((vRow) => {
                      const row = rows[vRow.index]
                      return (
                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      )
                    })}
                    {paddingBottom > 0 ? (
                      <TableRow aria-hidden>
                        <TableCell colSpan={columns.length} className="p-0" style={{ height: paddingBottom }} />
                      </TableRow>
                    ) : null}
                  </>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
        </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
        <div>
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} selected
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="rows-per-page" className="text-xs">Rows per page</Label>
          <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(v)=> table.setPageSize(Number(v))}>
            <SelectTrigger id="rows-per-page" size="sm" className="w-20"><SelectValue placeholder={table.getState().pagination.pageSize} /></SelectTrigger>
            <SelectContent align="end">
              {[10,20,30,40,50].map((n)=>(<SelectItem key={n} value={`${n}`}>{n}</SelectItem>))}
            </SelectContent>
          </Select>
          <div className="ml-4 inline-flex items-center gap-3">
            <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
            <div className="inline-flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-7" onClick={()=>table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                «
              </Button>
              <Button variant="outline" size="icon" className="size-7" onClick={()=>table.previousPage()} disabled={!table.getCanPreviousPage()}>
                ‹
              </Button>
              <Button variant="outline" size="icon" className="size-7" onClick={()=>table.nextPage()} disabled={!table.getCanNextPage()}>
                ›
              </Button>
              <Button variant="outline" size="icon" className="size-7" onClick={()=>table.setPageIndex(table.getPageCount()-1)} disabled={!table.getCanNextPage()}>
                »
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit dialog reuse */}
      {editing ? (
        <CreatePersonDialog
          initial={editing}
          open={true}
          onOpenChange={(o)=>{ if(!o) setEditing(null) }}
          onSaved={()=>{ setEditing(null); router.refresh() }}
          people={people}
          triggerClassName="hidden"
        />
      ) : null}
    </div>
  )
}

export const PeopleTable = memo(PeopleTableComponent)
