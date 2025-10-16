"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import { setModulePublishedAction } from "../../../classes/[id]/actions"

export function ModulePublishButton({
  moduleId,
  classId,
  published,
  disabled = false,
}: {
  moduleId: string
  classId: string
  published: boolean
  disabled?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const label = published ? "Unpublish" : "Publish"
  const variant = published ? "outline" : "default"

  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      disabled={pending || disabled}
      onClick={() => {
        startTransition(async () => {
          await setModulePublishedAction(moduleId, classId, !published)
          router.refresh()
        })
      }}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  )
}
