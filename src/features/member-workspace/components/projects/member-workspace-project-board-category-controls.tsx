"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowCounterClockwise,
  CircleNotch,
  DotsThreeVertical,
  PencilSimple,
  Plus,
  TrashSimple,
} from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"

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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { MemberWorkspaceWorkstreamCategory } from "../../types"

type CategoryMutationAction = (
  categoryId: string
) => Promise<{ ok: true; id: string } | { error: string }>

export function MemberWorkspaceProjectBoardCategoryToolbar({
  createCategoryAction,
  restoreDefaultsAction,
}: {
  createCategoryAction?: (
    name: string
  ) => Promise<{ ok: true; id: string } | { error: string }>
  restoreDefaultsAction?: () => Promise<{ ok: true } | { error: string }>
}) {
  const router = useRouter()
  const [newCategoryName, setNewCategoryName] = useState("")
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleCreateCategory = () => {
    if (!createCategoryAction) return
    const name = newCategoryName.trim()
    if (!name) {
      toast.error("Category name is required.")
      return
    }

    startTransition(async () => {
      const result = await createCategoryAction(name)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setNewCategoryName("")
      toast.success("Category added")
      router.refresh()
    })
  }

  const handleRestoreDefaults = () => {
    if (!restoreDefaultsAction) return
    startTransition(async () => {
      const result = await restoreDefaultsAction()
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setRestoreOpen(false)
      toast.success("Default categories restored")
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Your workstream categories
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {restoreDefaultsAction ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setRestoreOpen(true)}
            >
              <ArrowCounterClockwise className="h-4 w-4" />
              Restore defaults…
            </Button>
          ) : null}
          {createCategoryAction ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                  Add category
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 space-y-3" align="end">
                <div className="space-y-1">
                  <p className="text-sm font-medium">New category</p>
                  <p className="text-muted-foreground text-xs">
                    This category is visible only in your admin workstream.
                  </p>
                </div>
                <Input
                  value={newCategoryName}
                  maxLength={48}
                  placeholder="Needs review"
                  aria-label="New workstream category name"
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleCreateCategory()
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={isPending}
                  onClick={handleCreateCategory}
                >
                  Add category
                </Button>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
      </div>

      <AlertDialog
        open={restoreOpen}
        onOpenChange={(open) => {
          if (!isPending) setRestoreOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore default categories?</AlertDialogTitle>
            <AlertDialogDescription>
              This resets the names and order of the six default categories.
              Custom categories will not be changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault()
                handleRestoreDefaults()
              }}
            >
              {isPending ? (
                <CircleNotch className="h-4 w-4 animate-spin" />
              ) : null}
              Restore defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function MemberWorkspaceProjectBoardCategoryMenu({
  category,
  deleteCategoryAction,
  updateCategoryAction,
}: {
  category: MemberWorkspaceWorkstreamCategory
  deleteCategoryAction?: CategoryMutationAction
  updateCategoryAction: (
    categoryId: string,
    name: string
  ) => Promise<{ ok: true; id: string } | { error: string }>
}) {
  const router = useRouter()
  const [draftName, setDraftName] = useState(category.name)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isDefaultCategory = category.defaultKey !== null

  useEffect(() => setDraftName(category.name), [category.name])

  const handleRename = () => {
    const name = draftName.trim()
    if (!name) {
      toast.error("Category name is required.")
      return
    }

    startTransition(async () => {
      const result = await updateCategoryAction(category.id, name)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Category renamed")
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (!deleteCategoryAction) return
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setDeleteOpen(false)
      toast.success("Category deleted")
      router.refresh()
    })
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            type="button"
            aria-label={`Manage ${category.name} category`}
            disabled={isPending}
          >
            <DotsThreeVertical className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 space-y-3" align="end">
          <div className="space-y-1">
            <p className="text-sm font-medium">Edit category</p>
            <p className="text-muted-foreground text-xs">
              {isDefaultCategory
                ? "Default categories can be renamed but cannot be deleted."
                : "Moving organizations does not change their readiness."}
            </p>
          </div>
          <Input
            value={draftName}
            maxLength={48}
            aria-label={`${category.name} category name`}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleRename()
            }}
          />
          <div className="flex items-center justify-between gap-2">
            {isDefaultCategory ? (
              <span className="text-muted-foreground text-xs">
                Cannot be deleted
              </span>
            ) : deleteCategoryAction ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <TrashSimple className="h-4 w-4" />
                Delete
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleRename}
            >
              <PencilSimple className="h-4 w-4" />
              Save name
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {!isDefaultCategory && deleteCategoryAction ? (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this category?</AlertDialogTitle>
              <AlertDialogDescription>
                Organizations in {category.name} will return to their default
                workstream stage. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isPending}
                onClick={(event) => {
                  event.preventDefault()
                  handleDelete()
                }}
              >
                Delete category
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  )
}
