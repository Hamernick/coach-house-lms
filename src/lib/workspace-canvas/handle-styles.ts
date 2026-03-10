import { Position } from "reactflow"

import { cn } from "@/lib/utils"

export function resolveWorkspaceBoardHandleClassName({
  position: _position,
  hidden = false,
}: {
  position: Position
  hidden?: boolean
}) {
  return cn(
    hidden && "!pointer-events-none !opacity-0",
  )
}
