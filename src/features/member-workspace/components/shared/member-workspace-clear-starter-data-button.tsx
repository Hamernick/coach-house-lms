"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CircleNotch, Trash } from "@phosphor-icons/react/dist/ssr"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

export function MemberWorkspaceClearStarterDataButton({
  clearStarterDataAction,
  className,
}: {
  clearStarterDataAction: () => Promise<{ ok: true } | { error: string }>
  className?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleClear = () => {
    startTransition(async () => {
      const result = await clearStarterDataAction()
      if ("error" in result) {
        toast.error(result.error)
        return
      }

      setOpen(false)
      toast.success("Demo data cleared")
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={className}>
          <Trash data-icon="inline-start" weight="bold" />
          Clear demo data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear demo projects and tasks?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes seeded demo projects and seeded demo tasks for this organization.
            Real projects and tasks your team created will stay.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep demo data</AlertDialogCancel>
          <AlertDialogAction onClick={handleClear} disabled={isPending}>
            {isPending ? <CircleNotch className="h-4 w-4 animate-spin" /> : null}
            Clear demo data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
