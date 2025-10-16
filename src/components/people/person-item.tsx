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
import { IconDots } from "@tabler/icons-react"
import type { OrgPerson } from "@/app/(dashboard)/people/actions"
import { deletePersonAction, refreshPersonLinkedInImageAction } from "@/app/(dashboard)/people/actions"
import { toast } from "sonner"
import { CreatePersonDialog } from "./create-person-dialog"

const CATEGORY_CHIP: Record<OrgPerson["category"], string> = {
  staff: "bg-sky-500",
  board: "bg-violet-500",
  supporter: "bg-emerald-500",
}

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

export function PersonItem({ person, allPeople }: { person: OrgPerson & { displayImage?: string | null }, allPeople: (OrgPerson & { displayImage?: string | null })[] }) {
  const [editing, setEditing] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const router = useRouter()

  return (
    <>
      <Item className="cursor-pointer" onClick={() => setEditing(true)}>
        <Avatar className="size-10">
          <AvatarImage src={(person as any).displayImage ?? person.image ?? undefined} alt={person.name} />
          <AvatarFallback>{initials(person.name)}</AvatarFallback>
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
                <IconDots className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={()=>setEditing(true)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={async(e)=>{ e.stopPropagation(); const t=toast.loading("Refreshing photo…"); const r=await refreshPersonLinkedInImageAction(person.id); if (r && (r as any).error) { toast.error((r as any).error, { id: t }) } else { toast.success("Photo updated", { id: t }); router.refresh() } }}>Refresh photo from LinkedIn</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={(e)=>{ e.stopPropagation(); setConfirmOpen(true) }}>Delete</DropdownMenuItem>
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
              onClick={async()=>{
                const t = toast.loading("Deleting…")
                const r = await deletePersonAction(person.id)
                if (r && (r as any).error) {
                  toast.error((r as any).error, { id: t })
                } else {
                  toast.success("Deleted", { id: t })
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
