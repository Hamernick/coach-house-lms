import { useEffect, useRef } from "react"

import { useSidebar } from "@/components/ui/sidebar"

type SidebarAutoCollapseProps = {
  active: boolean
}

export function SidebarAutoCollapse({ active }: SidebarAutoCollapseProps) {
  const { setOpen } = useSidebar()
  const collapsedOnceRef = useRef(false)

  useEffect(() => {
    if (active && !collapsedOnceRef.current) {
      setOpen(false)
      collapsedOnceRef.current = true
    }
  }, [active, setOpen])

  return null
}
