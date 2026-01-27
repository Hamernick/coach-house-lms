"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import MoreHorizontalIcon from "lucide-react/dist/esm/icons/more-horizontal"
import type { OrgPerson } from "@/actions/people"
import { deletePersonAction, refreshPersonLinkedInImageAction } from "@/actions/people"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { CreatePersonDialog } from "./create-person-dialog"
import { PERSON_CATEGORY_META } from "@/lib/people/categories"

const CATEGORY_CHIP: Record<OrgPerson["category"], string> = Object.fromEntries(
  Object.entries(PERSON_CATEGORY_META).map(([key, value]) => [key, value.stripClass]),
) as Record<OrgPerson["category"], string>

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

export function PersonItem({
  person,
  allPeople,
}: {
  person: OrgPerson & { displayImage?: string | null }
  allPeople: (OrgPerson & { displayImage?: string | null })[]
}) {
  const [editing, setEditing] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const router = useRouter()
  const isSupporter = person.category === "supporters"

  return (
    <>
      <Item className="cursor-pointer" onClick={() => setEditing(true)}>
        <Avatar className={cn("size-10", isSupporter && "rounded-xl bg-muted/60 ring-1 ring-border/60")}>
          <AvatarImage
            src={person.displayImage ?? person.image ?? undefined}
            alt={person.name}
            className={cn(isSupporter && "object-contain p-1.5")}
          />
          <AvatarFallback className={cn(isSupporter && "rounded-xl")}>{initials(person.name)}</AvatarFallback>
        </Avatar>
        <ItemContent className="pl-2">
          <ItemTitle className="truncate">
            <span className="truncate">{person.name}</span>
          </ItemTitle>
          <ItemDescription className="truncate">{person.title}</ItemDescription>
        </ItemContent>
        <span className={`pointer-events-none absolute left-1.5 sm:left-2 top-1/2 h-10 w-1 -translate-y-1/2 rounded-full ${CATEGORY_CHIP[person.category]}`} aria-hidden="true" />
        <ItemActions>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e)=>e.stopPropagation()}>
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                onClick={async (event) => {
                  event.stopPropagation()
                  const toastId = toast.loading("Refreshing photo…")
                  const result = await refreshPersonLinkedInImageAction(person.id)
                  if ("error" in result) {
                    toast.error(result.error, { id: toastId })
                  } else {
                    toast.success("Photo updated", { id: toastId })
                    router.refresh()
                  }
                }}
              >
                Refresh photo from LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(event) => {
                  event.stopPropagation()
                  setConfirmOpen(true)
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ItemActions>
      </Item>

      <CreatePersonDialog
        initial={person}
        open={editing}
        onOpenChange={setEditing}
        onSaved={() => setEditing(false)}
        people={allPeople}
        triggerClassName="hidden"
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {person.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will remove the person from your org chart and lists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const toastId = toast.loading("Deleting…")
                const result = await deletePersonAction(person.id)
                if ("error" in result) {
                  toast.error(result.error, { id: toastId })
                } else {
                  toast.success("Deleted", { id: toastId })
                  router.refresh()
                }
                setConfirmOpen(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
