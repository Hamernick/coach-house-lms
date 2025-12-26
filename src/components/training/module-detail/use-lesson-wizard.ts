"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import type { LessonWizardPayload } from "@/lib/lessons/types"
import { toast } from "@/lib/toast"

interface UseLessonWizardProps {
  classId: string
  moduleId: string
}

export function useLessonWizard({ classId, moduleId }: UseLessonWizardProps) {
  const router = useRouter()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardPayload, setWizardPayload] = useState<LessonWizardPayload | null>(null)
  const [wizardLoading, setWizardLoading] = useState(false)
  const [wizardError, setWizardError] = useState<string | null>(null)
  const [wizardFocusModuleId, setWizardFocusModuleId] = useState<string | null>(moduleId)

  useEffect(() => {
    if (!wizardOpen) {
      setWizardFocusModuleId(moduleId)
    }
  }, [moduleId, wizardOpen])

  const resetWizard = useCallback(() => {
    setWizardPayload(null)
    setWizardError(null)
    setWizardFocusModuleId(moduleId)
  }, [moduleId])

  const loadWizardPayload = useCallback(
    async (focusModuleId: string | null) => {
      setWizardError(null)
      setWizardPayload(null)
      setWizardFocusModuleId(focusModuleId ?? moduleId)
      setWizardOpen(true)
      setWizardLoading(true)
      let success = false
      try {
        const response = await fetch(`/api/admin/classes/${classId}/wizard`, {
          cache: "no-store",
        })
        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.error ?? "Failed to load class data")
        }
        const data = (await response.json()) as { payload: LessonWizardPayload }
        setWizardPayload(data.payload)
        success = true
      } catch (err) {
        setWizardError(err instanceof Error ? err.message : "Failed to load class data")
      } finally {
        setWizardLoading(false)
      }
      return success
    },
    [classId, moduleId],
  )

  const handleCreateModule = useCallback(async () => {
    const toastId = toast.loading("Creating module…")
    setWizardError(null)
    setWizardLoading(true)
    try {
      const response = await fetch(`/api/admin/classes/${classId}/modules`, { method: "POST" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to create module")
      }
      const data = (await response.json()) as { moduleId?: string }
      if (!data?.moduleId) {
        throw new Error("Module id missing in response")
      }
      const ok = await loadWizardPayload(data.moduleId)
      if (ok) {
        toast.success("Module created", { id: toastId })
        router.refresh()
      } else {
        toast.error("Module created, but failed to open editor", { id: toastId })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create module"
      setWizardError(message)
      toast.error(message, { id: toastId })
      setWizardLoading(false)
    }
  }, [classId, loadWizardPayload, router])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setWizardOpen(open)
      if (!open) {
        resetWizard()
      }
    },
    [resetWizard],
  )

  return {
    wizardOpen,
    wizardPayload,
    wizardLoading,
    wizardError,
    wizardFocusModuleId,
    handleCreateModule,
    handleOpenChange,
    loadWizardPayload,
    resetWizard,
    setWizardPayload,
    setWizardFocusModuleId,
  }
}
