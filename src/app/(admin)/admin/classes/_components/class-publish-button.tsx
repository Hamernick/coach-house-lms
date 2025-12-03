"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"

import { Button } from "@/components/ui/button"

import { setClassPublishedAction } from "../actions"

export function ClassPublishButton({ classId, published }: { classId: string; published: boolean }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const label = published ? "Unpublish" : "Publish"
  const variant = published ? "outline" : "default"

  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await setClassPublishedAction(classId, !published)
          router.refresh()
        })
      }}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  )
}
