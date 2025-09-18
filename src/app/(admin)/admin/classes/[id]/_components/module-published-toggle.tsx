"use client"

import { useEffect, useState, useTransition } from "react"

import { Switch } from "@/components/ui/switch"

import { setModulePublishedAction } from "../actions"

export function ModulePublishedToggle({
  moduleId,
  classId,
  published,
}: {
  moduleId: string
  classId: string
  published: boolean
}) {
  const [checked, setChecked] = useState(published)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setChecked(published)
  }, [published])

  return (
    <Switch
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next)
        startTransition(async () => {
          await setModulePublishedAction(moduleId, classId, next)
        })
      }}
      disabled={isPending}
    />
  )
}
