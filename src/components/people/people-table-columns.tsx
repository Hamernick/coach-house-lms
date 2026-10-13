"use client"

import type { ColumnDef } from "@tanstack/react-table"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import MoreVerticalIcon from "lucide-react/dist/esm/icons/more-vertical"

import type { OrgPerson } from "@/actions/people"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ManagerSelect } from "@/components/people/manager-select"
import { PERSON_CATEGORY_META, PERSON_CATEGORY_OPTIONS } from "@/lib/people/categories"
import { cn } from "@/lib/utils"

import type { PersonRow } from "./people-table-types"

const CATEGORY_LABEL: Record<OrgPerson["category"], string> = Object.fromEntries(
  PERSON_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<OrgPerson["category"], string>

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

function canAssignManager(_category: OrgPerson["category"]) {
  return true
}

type BuildPeopleTableColumnsArgs = {
  canEdit: boolean
  people: PersonRow[]
  onEditPerson: (person: PersonRow) => void
  onManagerChange: (person: PersonRow, reportsToId: string | null) => void
  onRefreshLinkedInPhoto: (person: PersonRow) => Promise<void>
  onDeletePerson: (person: PersonRow) => Promise<void>
}

export function buildPeopleTableColumns({
  canEdit,
  people,
  onEditPerson,
  onManagerChange,
  onRefreshLinkedInPhoto,
  onDeletePerson,
}: BuildPeopleTableColumnsArgs): ColumnDef<PersonRow>[] {
  const cols: ColumnDef<PersonRow>[] = []

  if (canEdit) {
    cols.push({
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
    })
  }

  cols.push({
    accessorKey: "name",
    header: "Person",
    cell: ({ row }) => {
      const person = row.original
      const content = (
        <>
          <Avatar className="size-8">
            <AvatarImage src={person.displayImage ?? person.image ?? undefined} alt={person.name} />
            <AvatarFallback>{initials(person.name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className={cn("block truncate font-medium text-foreground", canEdit && "group-hover:underline")}>
              {person.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{person.title}</span>
          </span>
        </>
      )

      if (!canEdit) {
        return <div className="flex w-full items-center gap-3 text-left">{content}</div>
      }

      return (
        <Button
          type="button"
          variant="ghost"
          className="group h-auto w-full justify-start gap-3 p-0 text-left font-normal hover:bg-transparent"
          onClick={() => onEditPerson(person)}
        >
          {content}
        </Button>
      )
    },
  })

  cols.push({
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.original.category
      return (
        <Badge variant="outline" className={`px-1.5 ${PERSON_CATEGORY_META[category].badgeClass}`}>
          {CATEGORY_LABEL[category]}
        </Badge>
      )
    },
  })

  cols.push({
    id: "manager",
    header: "Reports To",
    cell: ({ row }) => {
      const person = row.original
      if (!canAssignManager(person.category)) {
        return <span className="text-muted-foreground">—</span>
      }

      if (!canEdit) {
        const manager = people.find((candidate) => candidate.id === person.reportsToId) ?? null
        return manager ? (
          <span className="text-sm text-foreground">{manager.name}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      }

      return (
        <ManagerSelect
          value={person.reportsToId ?? null}
          options={people.filter((candidate) => candidate.id !== person.id)}
          onChange={(next) => onManagerChange(person, next)}
        />
      )
    },
  })

  cols.push({
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
  })

  cols.push({
    id: "linkedin",
    header: "LinkedIn",
    cell: ({ row }) => {
      const url = row.original.linkedin
      if (!url) return <span className="text-muted-foreground">—</span>
      const href = url.startsWith("http") ? url : `https://www.linkedin.com/in/${url.replace(/^\//, "")}`
      try {
        const parsed = new URL(href)
        return (
          <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline">
            {parsed.hostname.replace(/^www\./, "")}
            <ExternalLinkIcon className="size-3" />
          </a>
        )
      } catch {
        return (
          <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline">
            LinkedIn <ExternalLinkIcon className="size-3" />
          </a>
        )
      }
    },
  })

  if (canEdit) {
    cols.push({
      id: "actions",
      cell: ({ row }) => {
        const person = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <MoreVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEditPerson(person)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => void onRefreshLinkedInPhoto(person)}>
                Refresh LinkedIn Photo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => void onDeletePerson(person)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    })
  }

  return cols
}
