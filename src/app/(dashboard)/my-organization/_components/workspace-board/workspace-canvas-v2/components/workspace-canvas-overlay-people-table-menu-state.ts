"use client"

import { useCallback, useState } from "react"

export function useWorkspacePeopleTableMenuState() {
  const [openSegmentMenuPersonId, setOpenSegmentMenuPersonId] = useState<
    string | null
  >(null)
  const [openTagMenuPersonId, setOpenTagMenuPersonId] = useState<string | null>(
    null
  )
  const handleSegmentMenuOpenChange = useCallback(
    (personId: string, open: boolean) => {
      setOpenSegmentMenuPersonId((current) =>
        open ? personId : current === personId ? null : current
      )
    },
    []
  )
  const handleTagMenuOpenChange = useCallback(
    (personId: string, open: boolean) => {
      setOpenTagMenuPersonId((current) =>
        open ? personId : current === personId ? null : current
      )
    },
    []
  )
  return {
    handleSegmentMenuOpenChange,
    handleTagMenuOpenChange,
    openSegmentMenuPersonId,
    openTagMenuPersonId,
  }
}
