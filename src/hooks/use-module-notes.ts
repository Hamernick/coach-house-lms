"use client"

import { useEffect, useRef, useState } from "react"

import { getModuleNotesAction, saveModuleNotesAction } from "@/app/actions/module-notes"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "@/lib/toast"

export function useModuleNotes(moduleId: string) {
  const [value, setValue] = useState("")
  const [loaded, setLoaded] = useState(false)
  const lastSavedRef = useRef<string>("")
  const loadErrorShown = useRef(false)
  const saveErrorShown = useRef(false)
  const debounced = useDebounce(value, 600)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    void getModuleNotesAction(moduleId).then((result) => {
      if (cancelled) return
      if ("error" in result) {
        if (!loadErrorShown.current) {
          toast.error(result.error)
          loadErrorShown.current = true
        }
        setLoaded(true)
        return
      }
      const nextValue = result.notes?.content ?? ""
      lastSavedRef.current = nextValue
      setValue(nextValue)
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [moduleId])

  useEffect(() => {
    if (!loaded) return
    const nextValue = debounced
    if (nextValue === lastSavedRef.current) return
    void saveModuleNotesAction(moduleId, nextValue).then((result) => {
      if ("error" in result) {
        if (!saveErrorShown.current) {
          toast.error(result.error)
          saveErrorShown.current = true
        }
        return
      }
      saveErrorShown.current = false
      lastSavedRef.current = result.notes?.content ?? ""
    })
  }, [debounced, loaded, moduleId])

  return { value, setValue }
}
