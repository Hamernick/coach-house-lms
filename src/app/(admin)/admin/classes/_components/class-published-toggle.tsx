"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Switch } from "@/components/ui/switch"

import { setClassPublishedAction } from "../actions"

export function ClassPublishedToggle({
  classId,
  published,
}: {
  classId: string
  published: boolean
}) {
  const [checked, setChecked] = useState(published)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    setChecked(published)
  }, [published])

  return (
    <Switch
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next)
        startTransition(async () => {
          await setClassPublishedAction(classId, next)
          router.refresh()
        })
      }}
      disabled={isPending}
    />
  )
}
