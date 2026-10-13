"use client"

import { memo, useCallback, useDeferredValue, useMemo, useState, useTransition } from "react"
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { toast } from "@/lib/toast"
import { deletePersonAction, refreshPersonLinkedInImageAction, upsertPersonAction } from "@/actions/people"
import { RightRailSlot } from "@/components/app-shell/right-rail"
import { CreatePersonDialog } from "@/components/people/create-person-dialog"
import { buildPeopleTableColumns } from "@/components/people/people-table-columns"
import { PeopleTableControls } from "@/components/people/people-table-controls"
import { PeopleTableGrid } from "@/components/people/people-table-grid"
import { PeopleTablePagination } from "@/components/people/people-table-pagination"
import type { OrgPerson } from "@/actions/people"
import type { PersonRow } from "@/components/people/people-table-types"

type PeopleTableShellProps = {
  people: PersonRow[]
  canEdit?: boolean
  controlsPlacement?: "rail" | "inline"
}

type PeopleTableProps = PeopleTableShellProps & {
  globalFilter: string
  categoryFilter: OrgPerson["category"] | "all"
}

export function PeopleTableShell({
  people,
  canEdit = true,
  controlsPlacement = "rail",
}: PeopleTableShellProps) {
  const [globalFilter, setGlobalFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<OrgPerson["category"] | "all">("all")

  const controls = (
    <PeopleTableControls
      people={people}
      canEdit={canEdit}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      categoryFilter={categoryFilter}
      onCategoryFilterChange={setCategoryFilter}
      layout={controlsPlacement}
    />
  )

  return (
    <>
      {controlsPlacement === "rail" ? <RightRailSlot>{controls}</RightRailSlot> : controls}
      <PeopleTable people={people} canEdit={canEdit} globalFilter={globalFilter} categoryFilter={categoryFilter} />
    </>
  )
}

function PeopleTableComponent({
  people,
  canEdit = true,
  globalFilter,
  categoryFilter,
}: PeopleTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [selection, setSelection] = useState<Record<string, boolean>>({})
  const [editing, setEditing] = useState<PersonRow | null>(null)
  const [, startTransition] = useTransition()

  const deferredFilter = useDeferredValue(globalFilter)
  const filtered = useMemo(() => {
    let out = people
    if (categoryFilter !== "all") out = out.filter((p) => p.category === categoryFilter)
    const q = deferredFilter.trim().toLowerCase()
    if (q) out = out.filter((p) => `${p.name} ${p.title ?? ""}`.toLowerCase().includes(q))
    return out
  }, [people, categoryFilter, deferredFilter])

  const handleEditPerson = useCallback((person: PersonRow) => {
    setEditing(person)
  }, [])

  const handleManagerChange = useCallback(
    (person: PersonRow, reportsToId: string | null) => {
      startTransition(async () => {
        const toastId = toast.loading("Updating manager…")
        const result = await upsertPersonAction({
          id: person.id,
          name: person.name,
          title: person.title ?? null,
          email: person.email ?? null,
          linkedin: person.linkedin ?? null,
          category: person.category,
          image: person.image ?? null,
          reportsToId,
        })
        if ("error" in result) {
          toast.error(result.error, { id: toastId })
        } else {
          toast.success("Updated", { id: toastId })
          router.refresh()
        }
      })
    },
    [router, startTransition],
  )

  const handleRefreshLinkedInPhoto = useCallback(
    async (person: PersonRow) => {
      const toastId = toast.loading("Refreshing photo…")
      const result = await refreshPersonLinkedInImageAction(person.id)
      if ("error" in result) {
        toast.error(result.error, { id: toastId })
      } else {
        toast.success("Photo updated", { id: toastId })
        router.refresh()
      }
    },
    [router],
  )

  const handleDeletePerson = useCallback(
    async (person: PersonRow) => {
      const toastId = toast.loading("Deleting…")
      const result = await deletePersonAction(person.id)
      if ("error" in result) {
        toast.error(result.error, { id: toastId })
      } else {
        toast.success("Deleted", { id: toastId })
        router.refresh()
      }
    },
    [router],
  )

  const columns = useMemo(
    () =>
      buildPeopleTableColumns({
        canEdit,
        people,
        onEditPerson: handleEditPerson,
        onManagerChange: handleManagerChange,
        onRefreshLinkedInPhoto: handleRefreshLinkedInPhoto,
        onDeletePerson: handleDeletePerson,
      }),
    [canEdit, handleDeletePerson, handleEditPerson, handleManagerChange, handleRefreshLinkedInPhoto, people],
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: {
      sorting,
      rowSelection: selection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <div className="flex flex-col gap-3 pb-8">
      <PeopleTableGrid table={table} columnCount={columns.length} />
      <PeopleTablePagination table={table} canEdit={canEdit} filteredCount={filtered.length} />

      {/* Edit dialog reuse */}
      {editing && canEdit ? (
        <CreatePersonDialog
          initial={editing}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditing(null)
          }}
          onSaved={() => {
            setEditing(null)
            router.refresh()
          }}
          people={people}
          triggerClassName="hidden"
        />
      ) : null}
    </div>
  )
}

export const PeopleTable = memo(PeopleTableComponent)
